import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Json from './Json';
import { IdentifierSystem } from '../utils/identifierSystem';
import { TResource } from '../types/resources/Resource';

describe('Json', () => {
    it('builds the Raw Json link using the uuid tag when present, not the (non-unique) id', () => {
        const resource = {
            resourceType: 'Patient',
            id: 'not-unique-id',
            meta: {
                tag: [{ system: IdentifierSystem.uuid, code: 'the-real-unique-uuid' }],
            },
        } as unknown as TResource;

        render(<Json resource={resource} />);

        const link = screen.getByRole('link', { name: /Raw Json/i });
        expect(link.getAttribute('href')).toContain('/4_0_0/Patient/the-real-unique-uuid');
        expect(link.getAttribute('href')).not.toContain('not-unique-id');
    });

    it('falls back to id when no uuid tag is present', () => {
        const resource = {
            resourceType: 'Patient',
            id: 'only-id-available',
        } as unknown as TResource;

        render(<Json resource={resource} />);

        const link = screen.getByRole('link', { name: /Raw Json/i });
        expect(link.getAttribute('href')).toContain('/4_0_0/Patient/only-id-available');
    });
});
