import { render } from '@testing-library/react';
import React, { useContext } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

type TEnvModule = typeof import('./EnvironmentContext');
type TEnvContext = React.ContextType<TEnvModule['default']>;

const deferred = <T,>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

// Everything in EnvironmentContext.ts runs at import time (the kill-switch, the context default
// and the fire-and-forget getVersion() call), so the environment and the FhirApi have to be in
// place before the module is pulled in.
const loadModule = async (
    env: Record<string, string | undefined>,
    versionPromise: Promise<string> = new Promise<string>(() => {})
): Promise<{ module: TEnvModule; constructorArgs: unknown[] }> => {
    const constructorArgs: unknown[] = [];
    vi.resetModules();
    vi.doMock('../runtimeEnv', () => ({ APP_ENV: env }));
    vi.doMock('../api/fhirApi', () => ({
        default: class FhirApiStub {
            constructor(args: unknown) {
                constructorArgs.push(args);
            }

            getVersion() {
                return versionPromise;
            }
        },
    }));
    const module = (await import('./EnvironmentContext')) as TEnvModule;
    return { module, constructorArgs };
};

const readContextDefault = (EnvContext: TEnvModule['default']): TEnvContext => {
    const seen: { value?: TEnvContext } = {};
    const Consumer = () => {
        seen.value = useContext(EnvContext);
        return null;
    };
    render(React.createElement(Consumer));
    return seen.value!;
};

const flushMicrotasks = async () => {
    await Promise.resolve();
    await Promise.resolve();
};

// Node's own unhandled-rejection hook, reached via globalThis because this project's tsconfig
// deliberately only pulls in `vite/client` types (no node globals).
const nodeProcess = (
    globalThis as unknown as {
        process: {
            on: (event: 'unhandledRejection', listener: (reason: unknown) => void) => void;
            off: (event: 'unhandledRejection', listener: (reason: unknown) => void) => void;
        };
    }
).process;

const baileyCases: { flagLabel: string; flag: string | undefined; expected: boolean }[] = [
    { flagLabel: 'unset (an environment that predates the flag)', flag: undefined, expected: true },
    { flagLabel: 'empty', flag: '', expected: true },
    { flagLabel: '"true"', flag: 'true', expected: true },
    { flagLabel: '"1"', flag: '1', expected: true },
    { flagLabel: '"false"', flag: 'false', expected: false },
    { flagLabel: '"0"', flag: '0', expected: false },
];

describe('EnvironmentContext', () => {
    afterEach(() => {
        vi.doUnmock('../runtimeEnv');
        vi.doUnmock('../api/fhirApi');
        vi.resetModules();
    });

    it.each(baileyCases)(
        'invariant 24 (opt-out kill switch): REACT_APP_ENABLE_BAILEY $flagLabel -> baileyEnabled $expected',
        async ({ flag, expected }) => {
            const { module } = await loadModule({ REACT_APP_ENABLE_BAILEY: flag });

            expect(module.baileyEnabled).toBe(expected);
            expect(readContextDefault(module.default).baileyEnabled).toBe(expected);
        }
    );

    it('maps each APP_ENV variable onto its own context field', async () => {
        const { module, constructorArgs } = await loadModule({
            REACT_APP_FHIR_SERVER_URL: 'https://fhir.example.test',
            REACT_APP_AUTH_PROVIDERS: 'provider-a,provider-b',
            REACT_APP_VERSION: '7.8.9',
            REACT_APP_AWS_REGION: 'us-east-2',
            REACT_APP_BAILEY_URL: 'https://bailey.example.test',
            REACT_APP_BAILEY_MODEL: 'bailey-test-model',
            REACT_APP_ENABLE_BAILEY: 'false',
        });

        const context = readContextDefault(module.default);

        // Distinct values per variable, so swapping any two fields would fail here.
        expect({
            fhirUrl: context.fhirUrl,
            AUTH_PROVIDERS: context.AUTH_PROVIDERS,
            FHIR_APP_VERSION: context.FHIR_APP_VERSION,
            AWS_REGION: context.AWS_REGION,
            baileyUrl: context.baileyUrl,
            baileyModel: context.baileyModel,
            baileyEnabled: context.baileyEnabled,
        }).toEqual({
            fhirUrl: 'https://fhir.example.test',
            AUTH_PROVIDERS: 'provider-a,provider-b',
            FHIR_APP_VERSION: '7.8.9',
            AWS_REGION: 'us-east-2',
            baileyUrl: 'https://bailey.example.test',
            baileyModel: 'bailey-test-model',
            baileyEnabled: false,
        });
        expect(constructorArgs).toEqual([
            { fhirUrl: 'https://fhir.example.test', setUserDetails: undefined },
        ]);
    });

    it('falls back to empty strings (and the literal "null" version) when nothing is configured', async () => {
        const { module } = await loadModule({});

        const context = readContextDefault(module.default);

        expect(context.fhirUrl).toBe('');
        expect(context.AUTH_PROVIDERS).toBe('');
        expect(context.FHIR_APP_VERSION).toBe('null');
        expect(context.AWS_REGION).toBe('');
        expect(context.baileyUrl).toBe('');
        expect(context.baileyModel).toBe('');
        expect(context.baileyEnabled).toBe(true);
        expect(context.getFhirServerVersion()).toBe('null');
    });

    it('getFhirServerVersion() reports "null" until the module-load getVersion() resolves, then the server version', async () => {
        const version = deferred<string>();
        const { module } = await loadModule(
            { REACT_APP_FHIR_SERVER_URL: 'https://fhir.example.test' },
            version.promise
        );
        const context = readContextDefault(module.default);

        expect(context.getFhirServerVersion()).toBe('null');

        version.resolve('5.4.3');
        await version.promise;
        await flushMicrotasks();

        expect(context.getFhirServerVersion()).toBe('5.4.3');
    });

    it('invariant 25: a rejected module-load getVersion() leaves the version at "null" without an unhandled rejection', async () => {
        const version = deferred<string>();
        const unhandled: unknown[] = [];
        const onUnhandled = (reason: unknown) => unhandled.push(reason);
        nodeProcess.on('unhandledRejection', onUnhandled);

        try {
            const { module } = await loadModule({ REACT_APP_FHIR_SERVER_URL: '' }, version.promise);
            const context = readContextDefault(module.default);

            version.reject(new Error('No FHIR server configured'));
            await flushMicrotasks();
            // A macrotask turn is when Node decides a rejection went unhandled.
            await new Promise((resolve) => setTimeout(resolve, 0));

            expect(context.getFhirServerVersion()).toBe('null');
            expect(unhandled).toEqual([]);
        } finally {
            nodeProcess.off('unhandledRejection', onUnhandled);
        }
    });
});
