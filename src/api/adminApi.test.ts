import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetAuthInfo } = vi.hoisted(() => ({ mockGetAuthInfo: vi.fn() }));

vi.mock('../utils/auth.utils', () => ({ logout: vi.fn(), removeAuthData: vi.fn() }));
vi.mock('../utils/authUrlProvider', () => ({
    default: vi.fn().mockImplementation(function AuthUrlProviderMock() {
        return { getAuthInfo: mockGetAuthInfo };
    }),
}));

import { logout } from '../utils/auth.utils';
import AdminApi from './adminApi';

const mockLogout = vi.mocked(logout);

const FHIR_URL = 'https://fhir.example.com';

const encode = (s: string) => new TextEncoder().encode(s);

const streamOf = (...parts: Uint8Array[]): ReadableStream<Uint8Array> =>
    new ReadableStream<Uint8Array>({
        start(controller) {
            parts.forEach((part) => controller.enqueue(part));
            controller.close();
        },
    });

const makeResponse = (status = 200, body = '{"ok":true}'): Response =>
    ({
        status,
        headers: new Headers(),
        body: streamOf(encode(body)),
        text: async () => body,
    }) as unknown as Response;

let mockFetch: ReturnType<typeof vi.fn>;

const newApi = (setUserDetails?: any) =>
    new AdminApi({ fhirUrl: FHIR_URL, setUserDetails });

beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockFetch = vi.fn().mockResolvedValue(makeResponse());
    vi.stubGlobal('fetch', mockFetch);
    mockGetAuthInfo.mockReturnValue({
        clientId: 'client',
        tokenForUserDetails: 'jwt',
        tokenToSendToFhirServer: 'jwt',
    });
});

afterEach(() => {
    vi.unstubAllGlobals();
});

const sentUrl = () => new URL(mockFetch.mock.calls[0][0] as string);
const sentInit = () => mockFetch.mock.calls[0][1] as RequestInit;
const sentBody = () => JSON.parse(sentInit().body as string);

describe('AdminApi.getUrl', () => {
    it('builds an admin-prefixed path resolved against the supplied FHIR base', () => {
        const url = newApi().getUrl({ resourceType: 'ExportStatus', fhirUrl: FHIR_URL });

        expect(url.origin).toBe(FHIR_URL);
        expect(url.pathname).toBe('/admin/ExportStatus');
    });

    it('appends the id as a path segment', () => {
        const url = newApi().getUrl({
            resourceType: 'ExportStatus',
            id: 'abc-123',
            fhirUrl: FHIR_URL,
        });

        expect(url.pathname).toBe('/admin/ExportStatus/abc-123');
    });

    it('accepts a queryString with or without its leading question mark', () => {
        const withMark = newApi().getUrl({
            resourceType: 'ExportStatus',
            queryString: '?status=completed',
            fhirUrl: FHIR_URL,
        });
        const withoutMark = newApi().getUrl({
            resourceType: 'ExportStatus',
            queryString: 'status=completed',
            fhirUrl: FHIR_URL,
        });

        expect(withMark.searchParams.get('status')).toBe('completed');
        expect(withoutMark.searchParams.get('status')).toBe('completed');
        expect(withMark.pathname).toBe('/admin/ExportStatus');
    });

    it('merges queryParameters on top of an existing queryString instead of replacing it', () => {
        const url = newApi().getUrl({
            resourceType: 'ExportStatus',
            queryString: 'status=completed',
            queryParameters: ['identifier=export-7'],
            fhirUrl: FHIR_URL,
        });

        expect(url.searchParams.get('status')).toBe('completed');
        expect(url.searchParams.get('identifier')).toBe('export-7');
    });

    it('appends rather than replaces repeated parameter names', () => {
        const url = newApi().getUrl({
            resourceType: 'ExportStatus',
            queryParameters: ['status=completed', 'status=in-progress'],
            fhirUrl: FHIR_URL,
        });

        expect(url.searchParams.getAll('status')).toEqual(['completed', 'in-progress']);
    });

    it('handles zero, one and many queryParameters', () => {
        const api = newApi();

        expect(
            api.getUrl({ resourceType: 'ExportStatus', queryParameters: [], fhirUrl: FHIR_URL })
                .searchParams.getAll('status')
        ).toEqual([]);
        expect(
            api
                .getUrl({
                    resourceType: 'ExportStatus',
                    queryParameters: ['a=1'],
                    fhirUrl: FHIR_URL,
                })
                .searchParams.get('a')
        ).toBe('1');

        const many = api.getUrl({
            resourceType: 'ExportStatus',
            queryParameters: ['a=1', 'b=2', 'c=3'],
            fhirUrl: FHIR_URL,
        });
        expect([many.searchParams.get('a'), many.searchParams.get('b'), many.searchParams.get('c')])
            .toEqual(['1', '2', '3']);
    });

    it('percent-encodes parameter values so they cannot inject extra parameters', () => {
        const url = newApi().getUrl({
            resourceType: 'ExportStatus',
            queryParameters: ['identifier=a&_count'],
            fhirUrl: FHIR_URL,
        });

        // The '&' stays inside the value; the only _count on the URL is the injected default.
        expect(url.searchParams.get('identifier')).toBe('a&_count');
        expect(url.searchParams.getAll('_count')).toEqual(['10']);
        expect(url.search).toContain('identifier=a%26_count');
    });

    it('injects the default _count=10 for a collection query (no id)', () => {
        const url = newApi().getUrl({ resourceType: 'ExportStatus', fhirUrl: FHIR_URL });

        expect(url.searchParams.get('_count')).toBe('10');
    });

    it('does not inject _count when a single resource is addressed by id', () => {
        const url = newApi().getUrl({
            resourceType: 'ExportStatus',
            id: 'abc-123',
            fhirUrl: FHIR_URL,
        });

        expect(url.searchParams.has('_count')).toBe(false);
    });

    it('respects a caller-supplied _count from the queryString', () => {
        const url = newApi().getUrl({
            resourceType: 'ExportStatus',
            queryString: '_count=50',
            fhirUrl: FHIR_URL,
        });

        expect(url.searchParams.getAll('_count')).toEqual(['50']);
    });

    it('respects a caller-supplied _count from queryParameters', () => {
        const url = newApi().getUrl({
            resourceType: 'ExportStatus',
            queryParameters: ['_count=50'],
            fhirUrl: FHIR_URL,
        });

        expect(url.searchParams.getAll('_count')).toEqual(['50']);
    });

    it('BUG-001: preserves a parameter value that itself contains "=" instead of truncating it', () => {
        // Reachable path: SearchContainer -> SearchFormQuery.getQueryParameters() -> the
        // `_source` field that searchForm.utils.getFormData appends for EVERY resource type ->
        // manageExport.tsx -> adminApi.getUrl({ queryParameters }). `_source` values are URLs,
        // which legally contain '='. FhirApi.getUrl splits on the FIRST '=' only; AdminApi.getUrl
        // uses String.split('='), so everything after the second '=' is dropped and the admin
        // query silently searches for a different value than the user typed.
        const source = 'https://example.com/exports?tenant=acme&run=7';

        const url = newApi().getUrl({
            resourceType: 'ExportStatus',
            queryParameters: [`_source=${source}`],
            fhirUrl: FHIR_URL,
        });

        expect(url.searchParams.get('_source')).toBe(source);
    });

    it('passes a value with no "=" in it through unchanged (control for BUG-001)', () => {
        const url = newApi().getUrl({
            resourceType: 'ExportStatus',
            queryParameters: ['_source=https://example.com/exports'],
            fhirUrl: FHIR_URL,
        });

        expect(url.searchParams.get('_source')).toBe('https://example.com/exports');
    });

    it('tolerates a bare parameter with no "=" without losing the rest of the query', () => {
        // A value-less entry is malformed input. BUG-001's fix changes what getUrl does with it
        // (today it appends the literal string "undefined"; the fix skips the entry), so this
        // asserts only what must hold either way: getUrl stays total, the well-formed sibling
        // parameter survives byte-identical (INV-7), the injected default is not duplicated, and
        // the path is untouched. Deliberately does NOT pin the bare entry's own rendering.
        const url = newApi().getUrl({
            resourceType: 'ExportStatus',
            queryParameters: ['status', '_source=https://example.com/exports'],
            fhirUrl: FHIR_URL,
        });

        expect(url.searchParams.get('_source')).toBe('https://example.com/exports');
        expect(url.searchParams.getAll('_count')).toEqual(['10']);
        expect(url.pathname).toBe('/admin/ExportStatus');
    });

    it('throws when no FHIR base URL is configured rather than building a relative request', () => {
        expect(() => newApi().getUrl({ resourceType: 'ExportStatus' })).toThrow(/Invalid URL/i);
    });
});

describe('AdminApi person-matching endpoints', () => {
    it('sends all four match operands as query parameters', async () => {
        await newApi().runPersonMatch({
            sourceId: 'person-1',
            sourceType: 'Person',
            targetId: 'patient-2',
            targetType: 'Patient',
        });

        const url = sentUrl();
        expect(url.pathname).toBe('/admin/runPersonMatch');
        expect(Object.fromEntries(url.searchParams)).toEqual({
            sourceId: 'person-1',
            sourceType: 'Person',
            targetId: 'patient-2',
            targetType: 'Patient',
        });
        expect(sentInit().method).toBe('GET');
    });

    it('omits includeMatchRequest unless it was explicitly requested', async () => {
        await newApi().runPersonMatch({
            sourceId: 'person-1',
            sourceType: 'Person',
            targetId: 'patient-2',
            targetType: 'Patient',
            includeMatchRequest: false,
        });

        expect(sentUrl().searchParams.has('includeMatchRequest')).toBe(false);
    });

    it('sends includeMatchRequest=true when requested', async () => {
        await newApi().runPersonMatch({
            sourceId: 'person-1',
            sourceType: 'Person',
            targetId: 'patient-2',
            targetType: 'Patient',
            includeMatchRequest: true,
        });

        expect(sentUrl().searchParams.get('includeMatchRequest')).toBe('true');
    });

    it('sends only id and resourceType for a one-to-N match by default', async () => {
        await newApi().runPersonOneToNMatch({ id: 'person-1', resourceType: 'Person' });

        expect(sentUrl().pathname).toBe('/admin/runPersonOneToNMatch');
        expect(Object.fromEntries(sentUrl().searchParams)).toEqual({
            id: 'person-1',
            resourceType: 'Person',
        });
    });

    it('adds matchResourceType to a one-to-N match when supplied', async () => {
        await newApi().runPersonOneToNMatch({
            id: 'person-1',
            resourceType: 'Person',
            matchResourceType: 'Patient',
            includeMatchRequest: true,
        });

        expect(sentUrl().searchParams.get('matchResourceType')).toBe('Patient');
        expect(sentUrl().searchParams.get('includeMatchRequest')).toBe('true');
    });

    it('POSTs a match payload verbatim', async () => {
        const parameters = {
            resourceType: 'Parameters',
            parameter: [{ name: 'resource', resource: { resourceType: 'Patient', id: 'p1' } }],
        };

        await newApi().runMatchWithPayload(parameters);

        expect(sentUrl().pathname).toBe('/admin/runMatchWithPayload');
        expect(sentInit().method).toBe('POST');
        expect(sentBody()).toEqual(parameters);
    });
});

describe('AdminApi $everything and delete endpoints', () => {
    it('requests $everything for a patient with contained resources as JSON', async () => {
        await newApi().getEverythingForPatient('patient-9');

        expect(sentUrl().pathname).toBe('/4_0_0/Patient/$everything');
        expect(Object.fromEntries(sentUrl().searchParams)).toEqual({
            id: 'patient-9',
            _format: 'json',
            contained: 'true',
        });
    });

    it('requests $everything for a person with contained resources as JSON', async () => {
        await newApi().getEverythingForPerson('person-9');

        expect(sentUrl().pathname).toBe('/4_0_0/Person/$everything');
        expect(sentUrl().searchParams.get('id')).toBe('person-9');
    });

    it('deletes a patient data graph with DELETE and no request body', async () => {
        await newApi().deletePatient('patient-9');

        expect(sentUrl().pathname).toBe('/admin/deletePatientDataGraph');
        expect(sentUrl().searchParams.get('id')).toBe('patient-9');
        expect(sentInit().method).toBe('DELETE');
        expect(sentInit().body).toBeUndefined();
    });

    it('deletes a person data graph with DELETE and no request body', async () => {
        await newApi().deletePerson('person-9');

        expect(sentUrl().pathname).toBe('/admin/deletePersonDataGraph');
        expect(sentUrl().searchParams.get('id')).toBe('person-9');
        expect(sentInit().method).toBe('DELETE');
    });

    it('carries the id of a delete target verbatim, including characters needing encoding', async () => {
        await newApi().deletePatient('patient/../person-1');

        // The id lands in the query string, where URL encoding keeps it a value rather than a
        // second path segment.
        expect(sentUrl().pathname).toBe('/admin/deletePatientDataGraph');
        expect(sentUrl().searchParams.get('id')).toBe('patient/../person-1');
    });
});

describe('AdminApi link management', () => {
    it('reads person-to-person links by bwell person id', async () => {
        await newApi().showPersonToPersonLink('bwell-1');

        expect(sentUrl().pathname).toBe('/admin/showPersonToPersonLink');
        expect(sentUrl().searchParams.get('bwellPersonId')).toBe('bwell-1');
        expect(sentInit().method).toBe('GET');
    });

    it('creates a person-to-person link with both ids in the POST body', async () => {
        await newApi().createPersonToPersonLink('bwell-1', 'external-2');

        expect(sentUrl().pathname).toBe('/admin/createPersonToPersonLink');
        expect(sentInit().method).toBe('POST');
        expect(sentBody()).toEqual({ bwellPersonId: 'bwell-1', externalPersonId: 'external-2' });
    });

    it('removes a person-to-person link with both ids in the POST body', async () => {
        await newApi().removePersonToPersonLink('bwell-1', 'external-2');

        expect(sentUrl().pathname).toBe('/admin/removePersonToPersonLink');
        expect(sentBody()).toEqual({ bwellPersonId: 'bwell-1', externalPersonId: 'external-2' });
    });

    it('creates a person-to-patient link with the external person id and patient id', async () => {
        await newApi().createPersonToPatientLink('external-2', 'patient-3');

        expect(sentUrl().pathname).toBe('/admin/createPersonToPatientLink');
        expect(sentBody()).toEqual({ externalPersonId: 'external-2', patientId: 'patient-3' });
    });

    it('removes a person-to-patient link keyed on personId, not externalPersonId', async () => {
        await newApi().removePersonToPatientLink('person-4', 'patient-3');

        expect(sentUrl().pathname).toBe('/admin/removePersonToPatientLink');
        expect(sentBody()).toEqual({ personId: 'person-4', patientId: 'patient-3' });
    });

    it('repoints a resource at a different patient with all three operands', async () => {
        await newApi().updatePatientReference('Observation', 'obs-1', 'patient-3');

        expect(sentUrl().pathname).toBe('/admin/updatePatientReference');
        expect(sentBody()).toEqual({
            resourceType: 'Observation',
            resourceId: 'obs-1',
            patientId: 'patient-3',
        });
    });
});

describe('AdminApi export, index, cache and log endpoints', () => {
    it('fetches export status through getUrl, including the injected _count', async () => {
        await newApi().getExportStatus({ resourceType: 'ExportStatus', fhirUrl: FHIR_URL });

        expect(sentUrl().pathname).toBe('/admin/ExportStatus');
        expect(sentUrl().searchParams.get('_count')).toBe('10');
        expect(sentInit().method).toBe('GET');
    });

    it('fetches a single export status by id without a _count', async () => {
        await newApi().getExportStatus({
            resourceType: 'ExportStatus',
            id: 'export-7',
            fhirUrl: FHIR_URL,
        });

        expect(sentUrl().pathname).toBe('/admin/ExportStatus/export-7');
        expect(sentUrl().searchParams.has('_count')).toBe(false);
    });

    it('triggers an export by POSTing to the id-suffixed path with no request body', async () => {
        await newApi().triggerExport('export-7');

        expect(sentUrl().pathname).toBe('/admin/triggerExport/export-7');
        expect(sentInit().method).toBe('POST');
        // triggerExport passes `data: null`, and BaseApi treats both null and undefined as
        // "no body" (baseApi.ts:187) rather than serializing the literal JSON `null`.
        expect(sentInit().body).toBeUndefined();
    });

    it('keeps a dot-segment trigger id on the configured FHIR origin (INV-1)', async () => {
        // `/admin/triggerExport/${id}` interpolates the id unencoded (adminApi.ts:163), so an id
        // containing '..' collapses the admin path. Routed through the real triggerExport + a
        // stubbed fetch so the assertion is about this repo's code, not the URL parser: the
        // request must never leave the configured FHIR origin whatever the id contains, and the
        // resolved path records today's behavior so encoding the id becomes a deliberate change.
        // Not filed as a bug (the id is server-supplied and the server authorizes each admin
        // endpoint independently) — see .qa/domain-invariants.md Suspicious Patterns.
        await newApi().triggerExport('../deletePatientDataGraph');

        expect(sentUrl().origin).toBe(FHIR_URL);
        expect(sentUrl().pathname).toBe('/admin/deletePatientDataGraph');
        expect(sentInit().method).toBe('POST');
    });

    it('sends the caller-provided path through indexApi with _format=1', async () => {
        await newApi().indexApi('/admin/indexes');

        expect(sentUrl().pathname).toBe('/admin/indexes');
        expect(sentUrl().searchParams.get('_format')).toBe('1');
        expect(sentUrl().searchParams.has('audit')).toBe(false);
    });

    it('adds audit=true to an index request only when auditing was asked for', async () => {
        await newApi().indexApi('/admin/indexes', true);

        expect(sentUrl().searchParams.get('audit')).toBe('true');
    });

    it('looks up cache keys by resource type and id', async () => {
        await newApi().getAllCacheKeys({ resourceId: 'patient-9', resourceType: 'Patient' });

        expect(sentUrl().pathname).toBe('/admin/getCacheKeys');
        expect(Object.fromEntries(sentUrl().searchParams)).toEqual({
            resourceId: 'patient-9',
            resourceType: 'Patient',
        });
    });

    it('invalidates the exact list of cache keys it was given (CACHE-1)', async () => {
        await newApi().invalidateCache({ cacheKeys: ['Patient:patient-9', 'Person:person-1'] });

        expect(sentUrl().pathname).toBe('/admin/invalidateCache');
        expect(sentInit().method).toBe('POST');
        expect(sentBody()).toEqual({ cacheKeys: ['Patient:patient-9', 'Person:person-1'] });
    });

    it('sends an empty cacheKeys list as an empty array, never as a wildcard', async () => {
        await newApi().invalidateCache({ cacheKeys: [] });

        expect(sentBody()).toEqual({ cacheKeys: [] });
    });

    it('searches logs by id', async () => {
        await newApi().searchLogs('request-abc');

        expect(sentUrl().pathname).toBe('/admin/searchLogResults');
        expect(sentUrl().searchParams.get('id')).toBe('request-abc');
    });
});

describe('AdminApi inherited auth behavior', () => {
    it('logs the user out when an admin endpoint answers 401 (INV-5)', async () => {
        const setUserDetails = vi.fn();
        mockFetch.mockResolvedValue(makeResponse(401, '{}'));

        await newApi(setUserDetails).deletePatient('patient-9');

        expect(mockLogout).toHaveBeenCalledWith(setUserDetails);
    });

    it('keeps the session when an admin endpoint answers 403 for lack of privilege (INV-6)', async () => {
        const setUserDetails = vi.fn();
        mockFetch.mockResolvedValue(
            makeResponse(403, '{"resourceType":"OperationOutcome","id":"forbidden"}')
        );

        const result = await newApi(setUserDetails).deletePatient('patient-9');

        expect(mockLogout).not.toHaveBeenCalled();
        expect(result.status).toBe(403);
    });

    it('attaches the session bearer token to admin requests (INV-2)', async () => {
        localStorage.setItem('jwt', 'admin-session-token');

        await newApi().getAllCacheKeys({ resourceId: 'patient-9', resourceType: 'Patient' });

        expect((sentInit().headers as Record<string, string>)['Authorization']).toBe(
            'Bearer admin-session-token'
        );
    });
});
