import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReverseReference from './ReverseReference';
import ReverseReferenceLink from './ReverseReferenceLink';

// The count hook fetches from the FHIR server; these tests are about the query the link builds, so the hook is
// replaced with one that records what it was asked to count.
const countCalls: Array<{ resourceType: string | undefined; queryParameters: string[] | undefined }> = [];
vi.mock('../hooks/useResourceCount', () => ({
    useResourceCount: (args: { resourceType: string | undefined; queryParameters: string[] | undefined }) => {
        countCalls.push({ resourceType: args.resourceType, queryParameters: args.queryParameters });
        return { count: 3, atLimit: false, isLoading: false, error: null };
    },
}));

describe('ReverseReferenceLink', () => {
    beforeEach(() => {
        countCalls.length = 0;
    });

    it('searches by the reverse property alone when no patient is given', () => {
        render(<ReverseReferenceLink target="DocumentReference" property="encounter" resolvedId="enc-1" />);

        expect(screen.getByRole('link')).toHaveAttribute('href', '/4_0_0/DocumentReference?encounter=enc-1');
        expect(countCalls.at(-1)).toEqual({ resourceType: 'DocumentReference', queryParameters: ['encounter=enc-1'] });
    });

    it('adds the patient to both the link and the count when one is given', () => {
        // DocumentReference?encounter=<id> alone timed out on staging (HTTP 500 after ~60 s); with patient= it answers
        // in seconds, so an Encounter page has to scope its search to the Encounter's subject.
        render(
            <ReverseReferenceLink
                target="DocumentReference"
                property="encounter"
                resolvedId="enc-1"
                patientReference="Patient/pat-1"
            />
        );

        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            '/4_0_0/DocumentReference?encounter=enc-1&patient=Patient/pat-1'
        );
        expect(countCalls.at(-1)).toEqual({
            resourceType: 'DocumentReference',
            queryParameters: ['encounter=enc-1', 'patient=Patient/pat-1'],
        });
    });

    it('leaves the search unscoped when the subject is not a Patient', () => {
        // Encounter.subject may reference a Group, and the patient= parameter matches Patient subjects only, so
        // patient=Group/<id> would hide every document the encounter= search finds.
        render(
            <ReverseReferenceLink
                target="DocumentReference"
                property="encounter"
                resolvedId="enc-1"
                patientReference="Group/grp-1"
            />
        );

        expect(screen.getByRole('link')).toHaveAttribute('href', '/4_0_0/DocumentReference?encounter=enc-1');
        expect(countCalls.at(-1)).toEqual({ resourceType: 'DocumentReference', queryParameters: ['encounter=enc-1'] });
    });

    it('still skips counting AuditEvent when a patient is given', () => {
        render(
            <ReverseReferenceLink target="AuditEvent" property="entity" resolvedId="enc-1" patientReference="Patient/pat-1" />
        );

        expect(screen.getByRole('link')).toHaveAttribute('href', '/4_0_0/AuditEvent?entity=enc-1&patient=Patient/pat-1');
        expect(countCalls.at(-1)).toEqual({ resourceType: 'AuditEvent', queryParameters: undefined });
    });
});

describe('ReverseReference', () => {
    beforeEach(() => {
        countCalls.length = 0;
    });

    it('passes the patient through to every link it renders', () => {
        render(
            <ReverseReference
                id="enc-1"
                resourceType="Encounter"
                patientReference="Patient/pat-1"
                reverseReferences={[{ target: 'DocumentReference', property: 'encounter' }]}
            />
        );

        expect(screen.getByRole('link')).toHaveAttribute(
            'href',
            '/4_0_0/DocumentReference?encounter=enc-1&patient=Patient/pat-1'
        );
    });
});
