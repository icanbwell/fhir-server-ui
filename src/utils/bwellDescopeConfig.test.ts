import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { APP_ENV } from '../runtimeEnv';
import {
    BWELL_DESCOPE_PROVIDER,
    DEFAULT_BWELL_DESCOPE_FLOW_ID,
    getBwellDescopeConfig,
} from './bwellDescopeConfig';

let envSnapshot: Record<string, string | undefined>;

describe('getBwellDescopeConfig', () => {
    beforeEach(() => {
        envSnapshot = { ...APP_ENV };
    });

    afterEach(() => {
        Object.keys(APP_ENV).forEach((key) => Reflect.deleteProperty(APP_ENV, key));
        Object.assign(APP_ENV, envSnapshot);
    });

    it('uses the lower-case provider key that matches REACT_APP_AUTH_PROVIDERS', () => {
        expect(BWELL_DESCOPE_PROVIDER).toBe('bwelldescope');
    });

    it('returns null when the project id is not configured', () => {
        Reflect.deleteProperty(APP_ENV, 'REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID');
        expect(getBwellDescopeConfig()).toBeNull();
    });

    it('returns null when the project id is only whitespace', () => {
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID = '   ';
        expect(getBwellDescopeConfig()).toBeNull();
    });

    it('defaults the flow id and leaves optional settings undefined', () => {
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID = 'P-test';
        expect(getBwellDescopeConfig()).toEqual({
            projectId: 'P-test',
            flowId: DEFAULT_BWELL_DESCOPE_FLOW_ID,
            tenantId: undefined,
            tenants: [],
            tenantsInvalid: false,
            baseUrl: undefined,
            baseStaticUrl: undefined,
        });
    });

    it('reads and trims every configured value', () => {
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID = ' P-test ';
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_FLOW_ID = ' custom-flow ';
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_TENANT_ID = ' tenant-1 ';
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_BASE_URL = ' https://auth.example.com ';
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_BASE_STATIC_URL = ' https://static.example.com ';
        expect(getBwellDescopeConfig()).toEqual({
            projectId: 'P-test',
            flowId: 'custom-flow',
            tenantId: 'tenant-1',
            tenants: [],
            tenantsInvalid: false,
            baseUrl: 'https://auth.example.com',
            baseStaticUrl: 'https://static.example.com',
        });
    });

    it('parses named tenants and skips malformed entries', () => {
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID = 'P-test';
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_TENANTS = ' Acme = T-acme , bad, Demo=T-demo ';
        expect(getBwellDescopeConfig()?.tenants).toEqual([
            { name: 'Acme', tenantId: 'T-acme' },
            { name: 'Demo', tenantId: 'T-demo' },
        ]);
    });

    it('parses valid tenants as valid', () => {
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID = 'P-test';
        APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_TENANTS = 'Acme=T-acme,Demo=T-demo';
        expect(getBwellDescopeConfig()?.tenantsInvalid).toBe(false);
    });

    it.each(['Acme', 'Acme=T-acme,bad', 'Acme=T-acme,Acme=T-other', 'Acme='])(
        'flags %j as an invalid tenant list',
        (raw) => {
            APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID = 'P-test';
            APP_ENV.REACT_APP_AUTH_BWELLDESCOPE_TENANTS = raw;
            expect(getBwellDescopeConfig()?.tenantsInvalid).toBe(true);
        }
    );
});
