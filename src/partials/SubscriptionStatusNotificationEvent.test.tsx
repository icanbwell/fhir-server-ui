import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SubscriptionStatusNotificationEvent from './SubscriptionStatusNotificationEvent';
import { TSubscriptionStatusNotificationEvent } from '../types/partials/SubscriptionStatusNotificationEvent';

const buildEvent = (eventNumber: string, timestamp: string): TSubscriptionStatusNotificationEvent => ({
    id: eventNumber,
    eventNumber,
    timestamp,
});

const cellsOf = (row: HTMLElement) => within(row).getAllByRole('cell').map((cell) => cell.textContent);

describe('SubscriptionStatusNotificationEvent', () => {
    it('sorts rows by eventNumber and computes "time since previous" against sorted neighbors, not wire order', () => {
        // Wire order is deliberately shuffled (3, 1, 4, 2) to mirror the real example payload,
        // which is not chronological / eventNumber-ordered on the wire. Timestamps are spaced
        // 1m/2m/3m apart in eventNumber order so a broken (unsorted) implementation would
        // produce different, easily-distinguishable deltas ("-3m", "6m", "-5m" - see below).
        const notificationEvent = [
            buildEvent('3', '2026-08-25T00:03:00.000Z'),
            buildEvent('1', '2026-08-25T00:00:00.000Z'),
            buildEvent('4', '2026-08-25T00:06:00.000Z'),
            buildEvent('2', '2026-08-25T00:01:00.000Z'),
        ];

        render(<SubscriptionStatusNotificationEvent notificationEvent={notificationEvent} name="Notification Event" field="" />);

        const rows = screen.getAllByRole('row').slice(1); // drop the header row
        expect(rows).toHaveLength(4);

        // Row order follows eventNumber ascending (1, 2, 3, 4), not the shuffled wire order.
        expect(cellsOf(rows[0])[0]).toBe('1');
        expect(cellsOf(rows[1])[0]).toBe('2');
        expect(cellsOf(rows[2])[0]).toBe('3');
        expect(cellsOf(rows[3])[0]).toBe('4');

        // The first (sorted) row has no previous row to diff against.
        expect(cellsOf(rows[0])[2]).toBe('—');
        // Each subsequent row's duration is computed against its sorted predecessor. If the sort
        // were a no-op and rows were diffed in wire order instead, these would be "-3m", "6m",
        // "-5m" respectively.
        expect(cellsOf(rows[1])[2]).toBe('1m');
        expect(cellsOf(rows[2])[2]).toBe('2m');
        expect(cellsOf(rows[3])[2]).toBe('3m');
    });

    it('renders nothing when notificationEvent is undefined', () => {
        const { container } = render(
            <SubscriptionStatusNotificationEvent notificationEvent={undefined} name="Notification Event" field="" />
        );
        expect(container).toBeEmptyDOMElement();
    });
});
