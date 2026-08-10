import { SchedulingDestination } from '../constants/schedulingDestinations';

export type SchedulingStepKey =
    | 'find-location'
    | 'find-appointment'
    | 'hold-appointment'
    | 'book-appointment';

export const SCHEDULING_STEPS: {
    key: SchedulingStepKey;
    label: string;
    method: 'POST';
    urlPath: string;
}[] = [
    { key: 'find-location', label: 'Find Locations', method: 'POST', urlPath: '/IHE/Location/$find' },
    { key: 'find-appointment', label: 'Find Appointments (ITI-115)', method: 'POST', urlPath: '/IHE/Appointment/$find' },
    { key: 'hold-appointment', label: 'Hold Appointment (ITI-116)', method: 'POST', urlPath: '/IHE/Appointment/$hold' },
    { key: 'book-appointment', label: 'Book Appointment (ITI-117)', method: 'POST', urlPath: '/IHE/Appointment/$book' },
];

// The `patient.reference` value below reuses this app's existing "Patient/person.<uuid>"
// convention (see getIPSLink in src/components/ResourceCard.tsx) rather than resolving the
// Person's linked Patient separately.
//
// Field names in each Parameters resource are a starting point based on the IHE PCC
// Scheduling profile's usual shape (organization/location/patient/appointment parts) — verify
// the exact parameter names scheduling-service expects against its
// ihe_scheduling/routes.py request schema before relying on these in a real environment (see
// design doc's Open Questions).
export const buildSchedulingRequestTemplate = (
    step: SchedulingStepKey,
    destination: SchedulingDestination,
    personId: string
): string => {
    const patientReference = `Patient/person.${personId}`;

    switch (step) {
        case 'find-location':
            return JSON.stringify(
                {
                    resourceType: 'Parameters',
                    parameter: [
                        { name: 'organization', valueReference: { reference: destination.organizationReference } },
                    ],
                },
                null,
                2
            );
        case 'find-appointment':
            return JSON.stringify(
                {
                    resourceType: 'Parameters',
                    parameter: [
                        { name: 'organization', valueReference: { reference: destination.organizationReference } },
                        { name: 'patient', valueReference: { reference: patientReference } },
                        { name: 'start', valueDateTime: '' },
                        { name: 'end', valueDateTime: '' },
                    ],
                },
                null,
                2
            );
        case 'hold-appointment':
            return JSON.stringify(
                {
                    resourceType: 'Appointment',
                    status: 'proposed',
                    // Paste the `Appointment` (or its reference) returned by the
                    // "Find Appointments" step's response here.
                    participant: [{ actor: { reference: patientReference }, status: 'accepted' }],
                },
                null,
                2
            );
        case 'book-appointment':
            return JSON.stringify(
                {
                    resourceType: 'Appointment',
                    status: 'booked',
                    // Paste the held `Appointment` (or its reference) returned by the
                    // "Hold Appointment" step's response here.
                    participant: [{ actor: { reference: patientReference }, status: 'accepted' }],
                },
                null,
                2
            );
    }
};
