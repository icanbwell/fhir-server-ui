export interface SchedulingDestination {
    slug: string;
    label: string;
    // FHIR Organization reference (e.g. "Organization/abc123") that scheduling-service
    // resolves server-side to pick the vendor for $find/$hold/$book. This ID is specific to
    // whichever FHIR server this app's REACT_APP_FHIR_SERVER_URL points at — left blank here
    // deliberately; whoever deploys this app to an environment fills these in for that
    // environment's real Organization resources before this console is usable there. See
    // "Destinations" in docs/superpowers/specs/2026-08-09-scheduling-service-test-console-design.md.
    organizationReference: string;
}

export const SCHEDULING_DESTINATIONS: SchedulingDestination[] = [
    { slug: 'medstar-idx', label: 'MedStar — Primary Care (IDX)', organizationReference: '' },
    { slug: 'medstar-solv', label: 'MedStar — Urgent Care / E-Visit (Solv)', organizationReference: '' },
    { slug: 'thedacare-epic-open', label: 'Thedacare — Epic Open Scheduling', organizationReference: '' },
    { slug: 'walgreens-vaccine', label: 'Walgreens — Vaccine Scheduling', organizationReference: '' },
];
