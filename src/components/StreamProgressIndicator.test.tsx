import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import StreamProgressIndicator from './StreamProgressIndicator';
import { StreamProgressState } from '../hooks/useStreamProgress';

describe('StreamProgressIndicator', () => {
    test.each<{
        name: string;
        progress: StreamProgressState;
        loading?: boolean;
        bars: number;
        caption?: string;
        valueNow?: string;
    }>([
        {
            name: 'streaming without a total shows one bar and a bytes-received caption',
            progress: { bytesReceived: 1024, totalBytes: undefined, isStreaming: true },
            bars: 1,
            caption: 'Loading… 1.0 KB received',
        },
        {
            name: 'streaming with a total shows one determinate bar and a percent caption',
            progress: { bytesReceived: 512, totalBytes: 1024, isStreaming: true },
            bars: 1,
            caption: 'Loading… 512 B of 1.0 KB (50%)',
            valueNow: '50',
        },
        {
            name: 'not streaming and loading omitted renders nothing',
            progress: { bytesReceived: 0, totalBytes: undefined, isStreaming: false },
            bars: 0,
        },
        {
            name: 'not streaming but loading shows one bare bar without a caption',
            progress: { bytesReceived: 0, totalBytes: undefined, isStreaming: false },
            loading: true,
            bars: 1,
        },
    ])('$name', ({ progress, loading, bars, caption, valueNow }) => {
        render(<StreamProgressIndicator progress={progress} loading={loading} />);

        const progressBars = screen.queryAllByRole('progressbar');
        expect(progressBars).toHaveLength(bars);
        if (valueNow !== undefined) {
            expect(progressBars[0]).toHaveAttribute('aria-valuenow', valueNow);
        }
        if (caption !== undefined) {
            expect(screen.getByText(caption)).toBeInTheDocument();
        } else {
            expect(screen.queryByText(/Loading/)).not.toBeInTheDocument();
        }
    });
});
