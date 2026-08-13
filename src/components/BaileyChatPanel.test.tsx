import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BaileyChatPanel from './BaileyChatPanel';
import { ThemeContextProvider } from '../context/ThemeContext';
import { UseBaileyChatResult } from '../hooks/useBaileyChat';

const baseChatResult: UseBaileyChatResult = {
    messages: [],
    traceEvents: [],
    lastRequest: null,
    status: 'idle',
    error: null,
    send: vi.fn(),
    stop: vi.fn(),
    retryLast: vi.fn(),
    clearTrace: vi.fn(),
};

const mockUseBaileyChat = vi.fn<() => UseBaileyChatResult>(() => baseChatResult);

vi.mock('../hooks/useBaileyChat', () => ({
    default: () => mockUseBaileyChat(),
}));

// jsdom doesn't implement scrollIntoView; BaileyChatPanel calls it to keep the transcript
// scrolled to the latest message.
Element.prototype.scrollIntoView = vi.fn();

describe('BaileyChatPanel', () => {
    it('renders a GFM markdown table from an assistant message as an actual table', () => {
        mockUseBaileyChat.mockReturnValue({
            ...baseChatResult,
            messages: [
                {
                    id: 'assistant-1',
                    role: 'assistant',
                    content: '| Name | Source |\n| --- | --- |\n| Imran Qureshi | Samsung |',
                },
            ],
        });

        render(
            <ThemeContextProvider>
                <BaileyChatPanel />
            </ThemeContextProvider>
        );

        expect(screen.getByRole('table')).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Source' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'Samsung' })).toBeInTheDocument();
    });
});
