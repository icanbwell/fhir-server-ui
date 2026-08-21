import { describe, expect, it } from 'vitest';
import {
    buildCompositionMatrix,
    getCategoryKey,
    getVersionKey,
    normalizePersonId,
    parsePersonReference,
} from './compositionIndex';
import { TComposition } from '../types/resources/Composition';

const composition = (overrides: Partial<TComposition> = {}): TComposition => ({
    resourceType: 'Composition',
    id: 'test-id',
    status: 'final',
    date: '2026-08-19T23:00:00.000Z',
    author: [],
    title: 'Test Composition',
    type: { coding: [{ code: 'immunization_summary_document' }] },
    meta: { source: 'https://www.icanbwell.com/fhir-composition-service' },
    ...overrides,
} as TComposition);

describe('getCategoryKey', () => {
    it('strips the _summary_document suffix from the type code', () => {
        expect(
            getCategoryKey(
                composition({ type: { coding: [{ code: 'immunization_summary_document' }] } })
            )
        ).toBe('immunization');
    });

    it('normalizes the V1 "allergy" code to match V2/V3 "allergyintolerance"', () => {
        expect(
            getCategoryKey(composition({ type: { coding: [{ code: 'allergy_summary_document' }] } }))
        ).toBe('allergyintolerance');
        expect(
            getCategoryKey(
                composition({ type: { coding: [{ code: 'allergyintolerance_summary_document' }] } })
            )
        ).toBe('allergyintolerance');
    });

    it('falls back to "unknown" when there is no type code', () => {
        expect(getCategoryKey(composition({ type: {} }))).toBe('unknown');
    });
});

describe('getVersionKey', () => {
    it('matches a known meta.source to its version key', () => {
        expect(
            getVersionKey(
                composition({ meta: { source: 'https://www.icanbwell.com/fhir-composition-service' } })
            )
        ).toBe('v3');
        expect(
            getVersionKey(
                composition({
                    meta: { source: 'https://www.icanbwell.com/intelligence-layer-databricks' },
                })
            )
        ).toBe('v2');
    });

    it('tolerates a trailing slash on meta.source', () => {
        expect(
            getVersionKey(
                composition({
                    meta: { source: 'https://www.icanbwell.com/intelligence-layer-pipeline/' },
                })
            )
        ).toBe('v1');
    });

    it('derives its own key from an unrecognized meta.source instead of dropping it', () => {
        expect(
            getVersionKey(composition({ meta: { source: 'https://www.icanbwell.com/some-new-service' } }))
        ).toBe('https://www.icanbwell.com/some-new-service');
    });
});

describe('buildCompositionMatrix', () => {
    it('orders known version columns V3, V2, V1', () => {
        const matrix = buildCompositionMatrix([
            composition({ meta: { source: 'https://www.icanbwell.com/intelligence-layer-pipeline' } }),
            composition({ meta: { source: 'https://www.icanbwell.com/fhir-composition-service' } }),
            composition({ meta: { source: 'https://www.icanbwell.com/intelligence-layer-databricks' } }),
        ]);

        expect(matrix.columns.map((c) => c.key)).toEqual(['v3', 'v2', 'v1']);
    });

    it('only includes columns for versions actually present in the data', () => {
        const matrix = buildCompositionMatrix([
            composition({ meta: { source: 'https://www.icanbwell.com/fhir-composition-service' } }),
        ]);

        expect(matrix.columns.map((c) => c.key)).toEqual(['v3']);
    });

    it('excludes an unrecognized source from columns/rows entirely, routing it to `other` instead', () => {
        const matrix = buildCompositionMatrix([
            composition({ meta: { source: 'https://www.icanbwell.com/fhir-composition-service' } }),
            composition({
                id: 'device-comp',
                meta: { source: 'https://www.icanbwell.com/device-data-ingest' },
                type: { coding: [{ code: 'device_metric_summary_document' }] },
                title: 'Device Metrics Summary',
            }),
        ]);

        expect(matrix.columns.map((c) => c.key)).toEqual(['v3']);
        expect(matrix.rows).toHaveLength(1);
        expect(matrix.other).toEqual([
            {
                id: 'device-comp',
                title: 'Device Metrics Summary',
                source: 'https://www.icanbwell.com/device-data-ingest',
                typeCode: 'device_metric_summary_document',
                lastUpdated: undefined,
            },
        ]);
    });

    it('keeps compositions that share a type code but have different titles as separate `other` entries, not merged', () => {
        const matrix = buildCompositionMatrix([
            composition({
                id: 'body-system-sleep',
                meta: { source: 'https://www.icanbwell.com/device-data-ingest' },
                type: { coding: [{ code: 'body_system_summary_document' }] },
                title: 'Healthspan Body System Summary — Sleep',
            }),
            composition({
                id: 'body-system-respiratory',
                meta: { source: 'https://www.icanbwell.com/device-data-ingest' },
                type: { coding: [{ code: 'body_system_summary_document' }] },
                title: 'Healthspan Body System Summary — Respiratory',
            }),
        ]);

        expect(matrix.rows).toHaveLength(0);
        expect(matrix.other).toHaveLength(2);
        expect(matrix.other.map((o) => o.id).sort()).toEqual([
            'body-system-respiratory',
            'body-system-sleep',
        ]);
    });

    it('merges V1 "allergy" and V2/V3 "allergyintolerance" into a single row', () => {
        const matrix = buildCompositionMatrix([
            composition({
                id: 'v1-allergy',
                meta: { source: 'https://www.icanbwell.com/intelligence-layer-pipeline' },
                type: { coding: [{ code: 'allergy_summary_document' }] },
            }),
            composition({
                id: 'v3-allergy',
                meta: { source: 'https://www.icanbwell.com/fhir-composition-service' },
                type: { coding: [{ code: 'allergyintolerance_summary_document' }] },
            }),
        ]);

        expect(matrix.rows).toHaveLength(1);
        expect(matrix.rows[0].categoryKey).toBe('allergyintolerance');
        expect(matrix.rows[0].cells['v1']?.[0].id).toBe('v1-allergy');
        expect(matrix.rows[0].cells['v3']?.[0].id).toBe('v3-allergy');
    });

    it('collects every distinct raw type code merged into a row, sorted', () => {
        const matrix = buildCompositionMatrix([
            composition({
                meta: { source: 'https://www.icanbwell.com/intelligence-layer-pipeline' },
                type: { coding: [{ code: 'allergy_summary_document' }] },
            }),
            composition({
                meta: { source: 'https://www.icanbwell.com/fhir-composition-service' },
                type: { coding: [{ code: 'allergyintolerance_summary_document' }] },
            }),
        ]);

        expect(matrix.rows[0].typeCodes).toEqual([
            'allergy_summary_document',
            'allergyintolerance_summary_document',
        ]);
    });

    it('lists a single type code once, not once per Composition sharing it', () => {
        const matrix = buildCompositionMatrix([
            composition({ id: 'first' }),
            composition({ id: 'second' }),
        ]);

        expect(matrix.rows[0].typeCodes).toEqual(['immunization_summary_document']);
    });

    it('leaves a cell empty (no entry) when a version has no Composition for that category', () => {
        const matrix = buildCompositionMatrix([
            composition({
                id: 'v3-careplan',
                meta: { source: 'https://www.icanbwell.com/fhir-composition-service' },
                type: { coding: [{ code: 'careplan_summary_document' }] },
            }),
            composition({
                id: 'v1-procedure',
                meta: { source: 'https://www.icanbwell.com/intelligence-layer-pipeline' },
                type: { coding: [{ code: 'procedure_summary_document' }] },
            }),
        ]);

        const row = matrix.rows.find((r) => r.categoryKey === 'careplan');
        expect(row?.cells['v3']).toHaveLength(1);
        expect(row?.cells['v1']).toBeUndefined();
    });

    it('keeps both Compositions when two share the same version and category', () => {
        const matrix = buildCompositionMatrix([
            composition({ id: 'first' }),
            composition({ id: 'second' }),
        ]);

        expect(matrix.rows).toHaveLength(1);
        expect(matrix.rows[0].cells['v3']).toHaveLength(2);
    });

    it('sorts rows alphabetically by category key', () => {
        const matrix = buildCompositionMatrix([
            composition({ type: { coding: [{ code: 'vital_summary_document' }] } }),
            composition({ type: { coding: [{ code: 'allergyintolerance_summary_document' }] } }),
            composition({ type: { coding: [{ code: 'immunization_summary_document' }] } }),
        ]);

        expect(matrix.rows.map((r) => r.categoryKey)).toEqual([
            'allergyintolerance',
            'immunization',
            'vital',
        ]);
    });

    it('returns no columns, rows, or other entries for an empty list', () => {
        const matrix = buildCompositionMatrix([]);

        expect(matrix.columns).toEqual([]);
        expect(matrix.rows).toEqual([]);
        expect(matrix.other).toEqual([]);
    });
});

describe('normalizePersonId', () => {
    it('prefixes a bare uuid with "person."', () => {
        expect(normalizePersonId('cc362570-1c65-4535-9d74-a9328debbb89')).toBe(
            'person.cc362570-1c65-4535-9d74-a9328debbb89'
        );
    });

    it('passes through an id that already carries a "person." prefix', () => {
        expect(normalizePersonId('person.cc362570-1c65-4535-9d74-a9328debbb89')).toBe(
            'person.cc362570-1c65-4535-9d74-a9328debbb89'
        );
    });

    it('trims surrounding whitespace', () => {
        expect(normalizePersonId('  cc362570-1c65-4535-9d74-a9328debbb89  ')).toBe(
            'person.cc362570-1c65-4535-9d74-a9328debbb89'
        );
    });
});

describe('parsePersonReference', () => {
    it('recognizes a "person."-prefixed id as a Person, stripping the prefix for bareId', () => {
        expect(parsePersonReference('person.cc362570-1c65-4535-9d74-a9328debbb89')).toEqual({
            resourceType: 'Person',
            bareId: 'cc362570-1c65-4535-9d74-a9328debbb89',
            searchValue: 'person.cc362570-1c65-4535-9d74-a9328debbb89',
        });
    });

    it('recognizes a bare id as a Patient, building a typed reference for searchValue', () => {
        // A bare uuid patient search param doesn't filter at all on the FHIR server (verified
        // live against a real environment) - it must be the typed "Patient/{uuid}" reference.
        expect(parsePersonReference('cc362570-1c65-4535-9d74-a9328debbb89')).toEqual({
            resourceType: 'Patient',
            bareId: 'cc362570-1c65-4535-9d74-a9328debbb89',
            searchValue: 'Patient/cc362570-1c65-4535-9d74-a9328debbb89',
        });
    });

    it('trims surrounding whitespace', () => {
        expect(parsePersonReference('  cc362570-1c65-4535-9d74-a9328debbb89  ')).toEqual({
            resourceType: 'Patient',
            bareId: 'cc362570-1c65-4535-9d74-a9328debbb89',
            searchValue: 'Patient/cc362570-1c65-4535-9d74-a9328debbb89',
        });
    });
});
