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

const baileyChartPropsSpy = vi.fn();

// BaileyChart wraps react-chartjs-2, which renders to canvas — not assertable via RTL queries.
// Mocked here for the same reason as BaileyChart.test.tsx: this test is about which code blocks
// get routed to BaileyChart, not about chart.js's own rendering.
vi.mock('./BaileyChart', () => ({
    default: (props: unknown) => {
        baileyChartPropsSpy(props);
        return <div data-testid="bailey-chart-stub" />;
    },
}));

const chartjsBlock = (json: string) => '```chartjs\n' + json + '\n```';

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
        expect(props.rows[0]).toEqual(['Row0', '0']);
    });

    it('renders a plain code block unaffected when its language is not chartjs', () => {
        mockUseBaileyChat.mockReturnValue({
            ...baseChatResult,
            messages: [
                { id: 'assistant-1', role: 'assistant', content: '```js\nconsole.log(1);\n```' },
            ],
        });

        render(
            <ThemeContextProvider>
                <BaileyChatPanel />
            </ThemeContextProvider>
        );

        expect(screen.getByText('console.log(1);')).toBeInTheDocument();
        expect(baileyChartPropsSpy).not.toHaveBeenCalled();
    });

    it('renders a valid chartjs code block via BaileyChart', () => {
        mockUseBaileyChat.mockReturnValue({
            ...baseChatResult,
            messages: [
                {
                    id: 'assistant-1',
                    role: 'assistant',
                    content: chartjsBlock(
                        JSON.stringify({
                            type: 'bar',
                            data: { labels: ['Jan', 'Feb'], datasets: [{ label: 'Systolic', data: [120, 118] }] },
                        })
                    ),
                },
            ],
        });

        render(
            <ThemeContextProvider>
                <BaileyChatPanel />
            </ThemeContextProvider>
        );

        expect(screen.getByTestId('bailey-chart-stub')).toBeInTheDocument();
        expect(baileyChartPropsSpy).toHaveBeenCalledTimes(1);
        const props = baileyChartPropsSpy.mock.calls[0][0] as { spec: { type: string } };
        expect(props.spec.type).toBe('bar');
    });

    it('falls back to a plain code block when the chartjs block is malformed', () => {
        mockUseBaileyChat.mockReturnValue({
            ...baseChatResult,
            messages: [{ id: 'assistant-1', role: 'assistant', content: chartjsBlock('{not valid json') }],
        });

        render(
            <ThemeContextProvider>
                <BaileyChatPanel />
            </ThemeContextProvider>
        );

        expect(screen.getByText('{not valid json')).toBeInTheDocument();
        expect(baileyChartPropsSpy).not.toHaveBeenCalled();
    });
});
