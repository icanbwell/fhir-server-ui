import { describe, expect, it } from 'vitest';
import { getAdvSearchFormData, getFormData } from './searchForm.utils';
import searchFieldsByResource from '../generated/searchFieldsByResource';

const namesOf = (fields: { name: string }[]) => fields.map(({ name }) => name);

// Appended to every form by getFormData, whatever the resource type.
const UNIVERSAL_TAIL = ['id', 'identifier', '_source'];

describe('getFormData', () => {
    it('builds the Patient form as given/family/email/_security followed by the universal tail', () => {
        expect(namesOf(getFormData('Patient'))).toEqual([
            'given',
            'family',
            'email',
            '_security',
            ...UNIVERSAL_TAIL,
        ]);
    });

    it('flags given and family for exact matching with their own sort fields', () => {
        const formData = getFormData('Patient');
        const given = formData.find((field) => field.name === 'given');
        const family = formData.find((field) => field.name === 'family');

        // useExactMatch drives the `:exact` modifier downstream in SearchFormQuery, and
        // sortField drives the column sort - a wrong value silently changes FHIR search
        // semantics rather than erroring.
        expect(given).toEqual({
            label: 'Given (Name)',
            name: 'given',
            sortField: 'name',
            useExactMatch: true,
        });
        expect(family).toEqual({
            label: 'Family (Name)',
            name: 'family',
            sortField: 'name.family',
            useExactMatch: true,
        });
    });

    it('gives Person the same field set as Patient', () => {
        expect(getFormData('Person')).toEqual(getFormData('Patient'));
    });

    it('swaps email for a non-exact npi field on Practitioner', () => {
        const formData = getFormData('Practitioner');

        expect(namesOf(formData)).toEqual(['given', 'family', 'npi', '_security', ...UNIVERSAL_TAIL]);
        expect(formData.find((field) => field.name === 'npi')).toEqual({
            label: 'NPI',
            name: 'npi',
            sortField: 'identifier',
        });
        expect(formData.find((field) => field.name === 'npi')?.useExactMatch).toBeUndefined();
        expect(namesOf(formData)).not.toContain('email');
    });

    it('builds the Organization form as name + _security + the universal tail', () => {
        const formData = getFormData('Organization');

        expect(namesOf(formData)).toEqual(['name', '_security', ...UNIVERSAL_TAIL]);
        expect(formData[0]).toEqual({ label: 'Name', name: 'name', sortField: 'name' });
    });

    it('builds the Encounter form as the period-backed date field + the universal tail', () => {
        const formData = getFormData('Encounter');

        expect(namesOf(formData)).toEqual(['date', ...UNIVERSAL_TAIL]);
        expect(formData[0]).toEqual({
            columnHeader: 'Period',
            label: 'Date',
            name: 'date',
            sortField: 'period',
        });
        expect(namesOf(formData)).not.toContain('_security');
    });

    it('returns only the universal tail for an unknown or empty resource type', () => {
        expect(namesOf(getFormData('NotARealResourceType'))).toEqual(UNIVERSAL_TAIL);
        expect(namesOf(getFormData(''))).toEqual(UNIVERSAL_TAIL);

        const unknownForm = getFormData('Observation');
        expect(unknownForm).toHaveLength(3);
        expect(unknownForm).toEqual([
            { label: 'Id', name: 'id', sortField: 'id', useExactMatch: true },
            { label: 'Identifier', name: 'identifier', sortField: 'identifier', useExactMatch: true },
            { label: 'Source', name: '_source', sortField: 'meta.source' },
        ]);
    });

    it('names the security-tag field exactly "_security" on every form that has one (invariant 22)', () => {
        ['Patient', 'Person', 'Practitioner', 'Organization'].forEach((resourceType) => {
            const securityField = getFormData(resourceType).find(
                (field) => field.label === 'Security'
            );

            expect(securityField).toEqual({
                label: 'Security',
                name: '_security',
                sortField: '_security',
                useExactMatch: true,
            });
        });
    });

    it('returns independent field objects on each call, so one form cannot mutate another', () => {
        const first = getFormData('Patient');
        const second = getFormData('Patient');

        expect(first).not.toBe(second);
        expect(first[0]).not.toBe(second[0]);

        first[0].label = 'MUTATED';
        first[0].useExactMatch = false;

        expect(second[0].label).toBe('Given (Name)');
        expect(second[0].useExactMatch).toBe(true);
        expect(getFormData('Person')[0].label).toBe('Given (Name)');
    });
});

describe('getAdvSearchFormData', () => {
    it('lists Patient\'s generated search fields minus the ones already in the basic form', () => {
        const advanced = getAdvSearchFormData('Patient');

        expect(namesOf(advanced)).toEqual([
            'address',
            'address-city',
            'address-country',
            'address-postalcode',
            'address-state',
            'name',
            'phonetic',
        ]);
        // given and family live in the basic form, so they must not be duplicated here.
        expect(namesOf(advanced)).not.toContain('given');
        expect(namesOf(advanced)).not.toContain('family');
    });

    it('never overlaps the basic form for any generated resource type', () => {
        const overlaps: string[] = [];

        Object.keys(searchFieldsByResource).forEach((resourceType) => {
            const basicNames = new Set(namesOf(getFormData(resourceType)));
            namesOf(getAdvSearchFormData(resourceType))
                .filter((name) => basicNames.has(name))
                .forEach((name) => overlaps.push(`${resourceType}.${name}`));
        });

        expect(overlaps).toEqual([]);
        expect(Object.keys(searchFieldsByResource).length).toBeGreaterThan(0);
    });

    it('derives labels by capitalising each hyphen-separated part', () => {
        const advanced = getAdvSearchFormData('Patient');
        const labelFor = (name: string) => advanced.find((field) => field.name === name)?.label;

        expect(labelFor('address-city')).toBe('Address City');
        expect(labelFor('address-postalcode')).toBe('Address Postalcode');
        expect(labelFor('phonetic')).toBe('Phonetic');
        // Every advanced field is label + name only - no sortField / useExactMatch.
        expect(advanced.find((field) => field.name === 'address')).toEqual({
            label: 'Address',
            name: 'address',
        });
    });

    it('returns an empty list for a resource type with no generated search fields', () => {
        expect(searchFieldsByResource.Encounter).toBeUndefined();
        expect(getAdvSearchFormData('Encounter')).toEqual([]);
        expect(getAdvSearchFormData('NotARealResourceType')).toEqual([]);
        expect(getAdvSearchFormData('')).toEqual([]);
    });

    it('is prototype-safe: inherited Object keys yield [] instead of crashing', () => {
        ['constructor', 'toString', '__proto__', 'valueOf', 'hasOwnProperty'].forEach((key) => {
            expect(getAdvSearchFormData(key)).toEqual([]);
        });
    });
});
