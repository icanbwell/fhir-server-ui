import { describe, expect, it } from 'vitest';
import { resourceDefinitions } from './resourceDefinitions';

// Every url in the generated table must be an R4B spec page. The capture group is the
// page slug, which has to be the resource name lower-cased - a copy/paste row that keeps
// one resource's name but another's url would still match the shape, so the slug is
// compared against the row's own name below.
const R4B_SPEC_URL = /^https:\/\/www\.hl7\.org\/fhir\/R4B\/([a-z]+)\.html$/;

// FHIR resource type identifiers are UpperCamelCase letters only (no digits, no
// separators) - anything else means the generator emitted a malformed row.
const FHIR_RESOURCE_TYPE_NAME = /^[A-Z][A-Za-z]+$/;

describe('resourceDefinitions (invariant 28: well-formed, unique resource catalogue)', () => {
    it('is a non-empty table and every row carries a non-blank name, description and url', () => {
        expect(resourceDefinitions.length).toBeGreaterThan(100);

        const incompleteRows = resourceDefinitions
            .map((entry, index) => ({ index, ...entry }))
            .filter(
                ({ name, description, url }) =>
                    typeof name !== 'string' ||
                    name.trim() === '' ||
                    typeof description !== 'string' ||
                    description.trim() === '' ||
                    typeof url !== 'string' ||
                    url.trim() === ''
            );

        expect(incompleteRows).toEqual([]);
    });

    it('has unique resource names (no duplicated rows)', () => {
        const counts = new Map<string, number>();
        resourceDefinitions.forEach(({ name }) => counts.set(name, (counts.get(name) ?? 0) + 1));

        const duplicateNames = [...counts.entries()]
            .filter(([, count]) => count > 1)
            .map(([name, count]) => `${name} (x${count})`);

        // On failure this reports exactly which resource names are duplicated.
        expect(duplicateNames).toEqual([]);
        expect(counts.size).toBe(resourceDefinitions.length);
    });

    it('points every row at the R4B spec page whose slug matches that row\'s own name', () => {
        const mismatchedRows = resourceDefinitions
            .filter(({ name, url }) => url !== `https://www.hl7.org/fhir/R4B/${name.toLowerCase()}.html`)
            .map(({ name, url }) => `${name} -> ${url}`);

        expect(mismatchedRows).toEqual([]);

        const badlyShapedUrls = resourceDefinitions
            .filter(({ url }) => !R4B_SPEC_URL.test(url))
            .map(({ name, url }) => `${name} -> ${url}`);

        expect(badlyShapedUrls).toEqual([]);

        // Spot-check the capture group so the slug/name relationship is asserted through
        // the pattern too, not only through string concatenation.
        const patientRow = resourceDefinitions.find(({ name }) => name === 'Patient');
        expect(R4B_SPEC_URL.exec(patientRow?.url ?? '')?.[1]).toBe('patient');
    });

    it('has unique urls (two resources never share one spec page)', () => {
        const urls = resourceDefinitions.map(({ url }) => url);
        const duplicateUrls = urls.filter((url, index) => urls.indexOf(url) !== index);

        expect(duplicateUrls).toEqual([]);
        expect(new Set(urls).size).toBe(resourceDefinitions.length);
    });

    it('uses valid UpperCamelCase FHIR resource type identifiers for every name', () => {
        const invalidNames = resourceDefinitions
            .map(({ name }) => name)
            .filter((name) => !FHIR_RESOURCE_TYPE_NAME.test(name));

        expect(invalidNames).toEqual([]);
        // Sanity-check the matcher itself against a real multi-word name from the table.
        expect(resourceDefinitions.some(({ name }) => name === 'AllergyIntolerance')).toBe(true);
    });

    it('contains the resource types the app itself depends on, each with the right spec url', () => {
        const required = {
            Patient: 'https://www.hl7.org/fhir/R4B/patient.html',
            Person: 'https://www.hl7.org/fhir/R4B/person.html',
            AuditEvent: 'https://www.hl7.org/fhir/R4B/auditevent.html',
            Binary: 'https://www.hl7.org/fhir/R4B/binary.html',
            DocumentReference: 'https://www.hl7.org/fhir/R4B/documentreference.html',
            Consent: 'https://www.hl7.org/fhir/R4B/consent.html',
        };

        Object.entries(required).forEach(([name, url]) => {
            const entry = resourceDefinitions.find((definition) => definition.name === name);
            expect(entry?.name).toBe(name);
            expect(entry?.url).toBe(url);
            expect(entry?.description.trim().length).toBeGreaterThan(0);
        });
    });

    it('is sorted by name, as the generator emits it (an unsorted table means a hand-edit)', () => {
        const names = resourceDefinitions.map(({ name }) => name);

        expect(names).toEqual([...names].sort());
        expect(names[0]).toBe('Account');
        expect(names[names.length - 1]).toBe('VisionPrescription');
    });

    it('exposes exactly the { name, description, url } fields its consumers destructure', () => {
        const rowsWithUnexpectedShape = resourceDefinitions
            .map((entry, index) => ({ index, keys: Object.keys(entry).sort().join(',') }))
            .filter(({ keys }) => keys !== 'description,name,url');

        expect(rowsWithUnexpectedShape).toEqual([]);
    });

    it('supports HomePage\'s case-insensitive substring name filter', () => {
        // Mirrors src/pages/HomePage.tsx: resourceDefinitions.filter((r) =>
        // r.name.toLowerCase().indexOf(search.toLowerCase()) !== -1)
        const filterByName = (search: string) =>
            resourceDefinitions
                .filter(({ name }) => name.toLowerCase().indexOf(search.toLowerCase()) !== -1)
                .map(({ name }) => name);

        expect(filterByName('PATIENT')).toEqual(['Patient']);
        expect(filterByName('auditevent')).toEqual(['AuditEvent']);
        expect(filterByName('allergy')).toEqual(['AllergyIntolerance']);
        expect(filterByName('definitely-not-a-fhir-resource')).toEqual([]);
    });
});
