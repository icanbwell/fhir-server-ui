import { describe, expect, it, vi } from 'vitest';
import { createBundleEntryParser } from './incrementalBundleParser';

const encode = (text: string) => new TextEncoder().encode(text);

describe('createBundleEntryParser', () => {
    it('emits every Bundle.entry[].resource in order, with every field intact', () => {
        const resources = [
            { resourceType: 'Patient', id: 'p1', active: true, name: [{ family: 'Alpha', given: ['Ann'] }] },
            { resourceType: 'Patient', id: 'p2', active: false, name: [{ family: 'Beta' }] },
            {
                resourceType: 'Observation',
                id: 'o1',
                status: 'final',
                valueQuantity: { value: 5.5, unit: 'mg', system: 'http://unitsofmeasure.org' },
            },
        ];
        const body = JSON.stringify({
            resourceType: 'Bundle',
            type: 'searchset',
            entry: resources.map((resource) => ({ resource })),
        });

        const onEntry = vi.fn();
        const onError = vi.fn();
        const parser = createBundleEntryParser(onEntry, onError);

        parser.write(encode(body));
        parser.finish();

        expect(onError).not.toHaveBeenCalled();
        expect(onEntry.mock.calls.map(([resource]) => resource)).toEqual(resources);
    });

    it('emits a resource as soon as its closing brace arrives, before the rest of the body is written', () => {
        const first = '{"resourceType":"Patient","id":"p1","gender":"female"}';
        const second = '{"resourceType":"Patient","id":"p2","gender":"male"}';

        const onEntry = vi.fn();
        const onError = vi.fn();
        const parser = createBundleEntryParser(onEntry, onError);

        // Chunk boundary sits immediately after the first resource's closing brace — the entry
        // wrapper, the second entry and the Bundle's own closing brace all arrive later.
        parser.write(encode(`{"resourceType":"Bundle","type":"searchset","entry":[{"resource":${first}`));
        expect(onEntry).toHaveBeenCalledTimes(1);
        expect(onEntry).toHaveBeenLastCalledWith({ resourceType: 'Patient', id: 'p1', gender: 'female' });

        parser.write(encode(`},{"resource":${second}`));
        expect(onEntry).toHaveBeenCalledTimes(2);
        expect(onEntry).toHaveBeenLastCalledWith({ resourceType: 'Patient', id: 'p2', gender: 'male' });

        parser.write(encode('}]}'));
        parser.finish();

        expect(onEntry).toHaveBeenCalledTimes(2);
        expect(onError).not.toHaveBeenCalled();
    });

    it('emits only entry[].resource — not the Bundle metadata, nor entry[].fullUrl/search', () => {
        const body = JSON.stringify({
            resourceType: 'Bundle',
            id: 'bundle-1',
            total: 2,
            link: [{ relation: 'self', url: 'https://fhir.example.test/4_0_0/Patient' }],
            entry: [
                {
                    fullUrl: 'https://fhir.example.test/4_0_0/Patient/p1',
                    resource: { resourceType: 'Patient', id: 'p1' },
                    search: { mode: 'match' },
                },
                {
                    fullUrl: 'https://fhir.example.test/4_0_0/Patient/p2',
                    resource: { resourceType: 'Patient', id: 'p2' },
                    search: { mode: 'include' },
                },
            ],
        });

        const onEntry = vi.fn();
        const onError = vi.fn();
        const parser = createBundleEntryParser(onEntry, onError);

        parser.write(encode(body));
        parser.finish();

        const emitted = onEntry.mock.calls.map(([resource]) => resource);
        expect(emitted).toEqual([
            { resourceType: 'Patient', id: 'p1' },
            { resourceType: 'Patient', id: 'p2' },
        ]);
        expect(emitted.some((value) => typeof value !== 'object')).toBe(false);
        expect(emitted.some((value) => 'mode' in value)).toBe(false);
        expect(onError).not.toHaveBeenCalled();
    });

    it.each([
        ['an empty entry array', '{"resourceType":"Bundle","type":"searchset","total":0,"entry":[]}'],
        ['no entry key at all', '{"resourceType":"Bundle","type":"searchset","total":0}'],
    ])('emits nothing and reports no error for a Bundle with %s', (_label, body) => {
        const onEntry = vi.fn();
        const onError = vi.fn();
        const parser = createBundleEntryParser(onEntry, onError);

        parser.write(encode(body));
        parser.finish();

        expect(onEntry).not.toHaveBeenCalled();
        expect(onError).not.toHaveBeenCalled();
    });

    it('invariant 23: a malformed token reports onError once, keeps the entries already emitted, and leaves write()/finish() safe to call', () => {
        const onEntry = vi.fn();
        const onError = vi.fn();
        const parser = createBundleEntryParser(onEntry, onError);

        parser.write(encode('{"resourceType":"Bundle","entry":[{"resource":{"resourceType":"Patient","id":"p1"}}'));
        expect(onEntry).toHaveBeenCalledTimes(1);
        expect(onError).not.toHaveBeenCalled();

        parser.write(encode(',{"resource":{"resourceType":"Patient","id":@@@}}]}'));
        expect(onError).toHaveBeenCalledTimes(1);
        expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);

        // Fail-whole: the caller stops streaming and falls back to a full JSON.parse, but it must
        // not be punished for the write()/finish() calls already in flight.
        expect(() => parser.write(encode('{"trailing":"bytes"}'))).not.toThrow();
        expect(() => parser.finish()).not.toThrow();

        // The caller needs to know how far the stream actually got.
        expect(onEntry.mock.calls.map(([resource]) => resource)).toEqual([
            { resourceType: 'Patient', id: 'p1' },
        ]);
    });

    it('guards against double-ending: finish() after the Bundle auto-ended, finish() twice, and write() after the end are all no-ops', () => {
        const body = '{"resourceType":"Bundle","type":"searchset","entry":[{"resource":{"resourceType":"Patient","id":"p1"}}]}';

        const onEntry = vi.fn();
        const onError = vi.fn();
        const parser = createBundleEntryParser(onEntry, onError);

        parser.write(encode(body));
        expect(() => parser.finish()).not.toThrow();
        expect(() => parser.finish()).not.toThrow();
        expect(() => parser.write(encode('{"another":"bundle"}'))).not.toThrow();

        expect(onError).not.toHaveBeenCalled();
        expect(onEntry.mock.calls.map(([resource]) => resource)).toEqual([
            { resourceType: 'Patient', id: 'p1' },
        ]);
    });
});
