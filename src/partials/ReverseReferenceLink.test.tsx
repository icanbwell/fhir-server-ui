import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import ReverseReference from './ReverseReference';

vi.mock('../hooks/useResourceCount', () => ({
    useResourceCount: vi.fn(() => ({ count: null, atLimit: false, isLoading: false, error: null })),
}));

const EXT = 'https%3A%2F%2Ficanbwell.com%2Fcodes%2Fclient_person_id';

describe('ReverseReference links', () => {
    it.each(['Subscription', 'SubscriptionStatus'])(
        'links %s on a Person to the excel view by client_person_id extension',
        (target) => {
            render(
                <ReverseReference
                    id="person-1"
                    resourceType="Person"
                    reverseReferences={[{ target, property: 'patient' }]}
                />
            );
            expect(screen.getByRole('link')).toHaveAttribute(
                'href',
                `/excel/4_0_0/${target}?extension=${EXT}|person-1`
            );
        }
    );

    it('keeps the patient-reference link for other targets on a Person', () => {
        render(
            <ReverseReference
                id="person-1"
                resourceType="Person"
                reverseReferences={[{ target: 'Task', property: 'patient' }]}
            />
        );
        expect(screen.getByRole('link')).toHaveAttribute('href', '/4_0_0/Task?patient=Patient/person.person-1');
    });
});
