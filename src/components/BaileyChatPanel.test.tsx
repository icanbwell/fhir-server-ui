import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const baileyTablePropsSpy = vi.fn();

// BaileyTable wraps ag-grid, which needs real layout measurement jsdom can't provide (see
// BaileyTable.test.tsx). Mocked here for the same reason — this test is about which markdown
// tables get routed to BaileyTable, not about ag-grid's own rendering.
vi.mock('./BaileyTable', () => ({
    default: (props: unknown) => {
        baileyTablePropsSpy(props);
        return <div data-testid="bailey-table-stub" />;
    },
}));

const gfmTable = (dataRowCount: number) => {
    const header = '| Name | Value |\n| --- | --- |\n';
    const rows = Array.from({ length: dataRowCount }, (_, i) => `| Row${i} | ${i} |`).join('\n');
    return header + rows;
};

describe('BaileyChatPanel', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders a small GFM markdown table from an assistant message as a plain table', () => {
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
        expect(baileyTablePropsSpy).not.toHaveBeenCalled();
    });

    it('renders a large GFM markdown table (more than 5 rows) via BaileyTable', () => {
        mockUseBaileyChat.mockReturnValue({
            ...baseChatResult,
            messages: [
                {
                    id: 'assistant-1',
                    role: 'assistant',
                    content: gfmTable(6),
                },
            ],
        });

        render(
            <ThemeContextProvider>
                <BaileyChatPanel />
            </ThemeContextProvider>
        );

        expect(screen.getByTestId('bailey-table-stub')).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
        expect(baileyTablePropsSpy).toHaveBeenCalledTimes(1);
        const props = baileyTablePropsSpy.mock.calls[0][0] as { headers: string[]; rows: string[][] };
        expect(props.headers).toEqual(['Name', 'Value']);
        expect(props.rows).toHaveLength(6);
        expect(props.rows[0]).toEqual([{ text: 'Row0' }, { text: '0' }]);
    });
});
