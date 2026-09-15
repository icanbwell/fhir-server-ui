import { describe, expect, it } from 'vitest';
import SearchFormQuery from './searchFormQuery';

const START = new Date('2026-03-01T09:15:30Z');
const END = new Date('2026-03-15T21:45:00Z');

// SearchContainer hands the constructor one flat object: start / end / resourceType plus
// one key per form field. The declared constructor type only names the first three, so
// build the argument through a helper instead of repeating a cast at every call site.
const buildQuery = (args: Record<string, unknown>): SearchFormQuery =>
    new SearchFormQuery(args as any);

describe('SearchFormQuery.getQueryParameters', () => {
    it('bounds a non-AuditEvent search on _lastUpdated', () => {
        const params = buildQuery({ start: START, end: END, resourceType: 'Patient' }).getQueryParameters();

        expect(params).toEqual(['_lastUpdated=gt2026-03-01', '_lastUpdated=lt2026-03-15']);
    });

    it('bounds an AuditEvent search on date, not _lastUpdated (invariant 8)', () => {
        const params = buildQuery({
            start: START,
            end: END,
            resourceType: 'AuditEvent',
        }).getQueryParameters();

        // AuditEvent is indexed on `date`; emitting `_lastUpdated` here would leave the
        // AuditEvent query unbounded.
        expect(params).toEqual(['date=gt2026-03-01', 'date=lt2026-03-15']);
        expect(params.some((param) => param.startsWith('_lastUpdated='))).toBe(false);
    });

    it('emits only the lower bound when just start is supplied', () => {
        expect(buildQuery({ start: START, resourceType: 'Patient' }).getQueryParameters()).toEqual([
            '_lastUpdated=gt2026-03-01',
        ]);
        expect(buildQuery({ start: START, resourceType: 'AuditEvent' }).getQueryParameters()).toEqual([
            'date=gt2026-03-01',
        ]);
    });

    it('emits only the upper bound when just end is supplied', () => {
        expect(buildQuery({ end: END, resourceType: 'Patient' }).getQueryParameters()).toEqual([
            '_lastUpdated=lt2026-03-15',
        ]);
        expect(buildQuery({ end: END, resourceType: 'AuditEvent' }).getQueryParameters()).toEqual([
            'date=lt2026-03-15',
        ]);
    });

    it('emits no date bounds at all when neither start nor end is supplied', () => {
        const params = buildQuery({
            start: null,
            end: null,
            resourceType: 'Patient',
            id: 'abc',
        }).getQueryParameters();

        expect(params).toEqual(['id=abc']);
    });

    it('appends :exact to given and family only', () => {
        const params = buildQuery({
            resourceType: 'Patient',
            given: 'John',
            family: 'Smith',
            email: 'john@example.com',
            _security: 'https://www.icanbwell.com/owner|bwell',
        }).getQueryParameters();

        expect(params).toContain('given:exact=John');
        expect(params).toContain('family:exact=Smith');
        expect(params).toContain('email=john@example.com');
        expect(params).toContain('_security=https://www.icanbwell.com/owner|bwell');
        expect(params.some((param) => param.startsWith('email:exact='))).toBe(false);
        expect(params.some((param) => param.startsWith('_security:exact='))).toBe(false);
    });

    it('omits fields whose value is an empty string or otherwise blank', () => {
        const params = buildQuery({
            resourceType: 'Patient',
            given: '',
            family: 'Smith',
            email: undefined,
            identifier: null,
            _source: 0,
        }).getQueryParameters();

        // An untouched text box must not become `field=`.
        expect(params).toEqual(['family:exact=Smith']);
        expect(params.some((param) => param.endsWith('='))).toBe(false);
    });

    it('consumes start, end and resourceType instead of re-emitting them as filters', () => {
        const params = buildQuery({
            start: START,
            end: END,
            resourceType: 'AuditEvent',
            given: 'John',
        }).getQueryParameters();

        expect(params).toEqual(['date=gt2026-03-01', 'date=lt2026-03-15', 'given:exact=John']);
        ['start=', 'end=', 'resourceType='].forEach((prefix) => {
            expect(params.some((param) => param.startsWith(prefix))).toBe(false);
        });
    });

    it('passes values containing = and & through verbatim (invariant 7)', () => {
        const sourceWithQueryString = 'https://example.com/fhir?a=1&b=2';
        const base64Identifier = 'urn:oid:1.2.3|YWJjZA==';
        const params = buildQuery({
            resourceType: 'Patient',
            _source: sourceWithQueryString,
            identifier: base64Identifier,
        }).getQueryParameters();

        // Encoding is the URL layer's job (fhirApi.getUrl splits on the FIRST '=' and
        // hands name/value to URLSearchParams), so this layer must not escape or truncate.
        expect(params).toContain(`_source=${sourceWithQueryString}`);
        expect(params).toContain(`identifier=${base64Identifier}`);
        expect(params).toContain('_source=https://example.com/fhir?a=1&b=2');
        expect(params).toContain('identifier=urn:oid:1.2.3|YWJjZA==');
    });

    it('reduces the date bounds to a date-only value, dropping the time component', () => {
        const params = buildQuery({
            start: new Date('2026-01-05T23:59:59.999Z'),
            end: new Date('2026-12-31T00:00:00.000Z'),
            resourceType: 'Patient',
        }).getQueryParameters();

        expect(params).toEqual(['_lastUpdated=gt2026-01-05', '_lastUpdated=lt2026-12-31']);
        params.forEach((param) => {
            expect(param).not.toContain('T');
            expect(param).not.toMatch(/\d{2}:\d{2}/);
        });
    });

    it('keeps the constructor-consumed fields addressable on the instance', () => {
        const query = buildQuery({
            start: START,
            end: END,
            resourceType: 'AuditEvent',
            given: 'John',
        });

        expect(query.start).toBe(START);
        expect(query.end).toBe(END);
        expect(query.resourceType).toBe('AuditEvent');
        expect(query.params).toEqual({ given: 'John' });
    });
});
