import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ReverseReference from './ReverseReference';
import { useResourceCount } from '../hooks/useResourceCount';

vi.mock('../hooks/useResourceCount', () => ({
    useResourceCount: vi.fn(() => ({ count: null, atLimit: false, isLoading: false, error: null })),
}));

const SYSTEM = 'https://icanbwell.com/codes/client_person_id';
const ENCODED_SYSTEM = 'https%3A%2F%2Ficanbwell.com%2Fcodes%2Fclient_person_id';

describe('ReverseReference links', () => {
    beforeEach(() => {
        vi.mocked(useResourceCount).mockClear();
    });

    it.each([
        ['Person', 'Subscription', `/excel/4_0_0/Subscription?extension=${ENCODED_SYSTEM}|person-1`, `extension=${SYSTEM}|person-1`],
        ['Person', 'SubscriptionStatus', `/excel/4_0_0/SubscriptionStatus?extension=${ENCODED_SYSTEM}|person-1`, `extension=${SYSTEM}|person-1`],
        ['Person', 'Task', '/4_0_0/Task?patient=Patient/person.person-1', 'patient=Patient/person.person-1'],
        ['Patient', 'Subscription', '/4_0_0/Subscription?patient=Patient/person-1', 'patient=Patient/person-1'],
    ])('%s + %s links to %s', (resourceType, target, expectedHref, expectedCountQuery) => {
        render(
            <ReverseReference
                id="person-1"
                resourceType={resourceType}
                reverseReferences={[{ target, property: 'patient' }]}
            />
        );

        expect(screen.getByRole('link')).toHaveAttribute('href', expectedHref);
        // The count query must be unencoded; FhirApi.getUrl encodes it once on the wire.
        expect(useResourceCount).toHaveBeenCalledWith(
            expect.objectContaining({ resourceType: target, queryParameters: [expectedCountQuery] })
        );
    });
});
