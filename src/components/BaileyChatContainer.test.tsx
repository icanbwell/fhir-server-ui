import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BaileyChatContainer from './BaileyChatContainer';
import EnvContext from '../context/EnvironmentContext';
import { ThemeContextProvider } from '../context/ThemeContext';

const useBaileyChatMock = vi.fn((_config: unknown) => ({ chat: 'result' }));
const baileyChatPanelPropsSpy = vi.fn();

vi.mock('@icanbwell/baileyai-chat-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@icanbwell/baileyai-chat-ui')>();
    return {
        ...actual,
        useBaileyChat: (config: unknown) => useBaileyChatMock(config),
        BaileyChatPanel: (props: { chat: unknown }) => {
            baileyChatPanelPropsSpy(props);
            return <div data-testid="bailey-chat-panel" />;
        },
    };
});

vi.mock('../hooks/useBaileyChatTransport', () => ({
    useBaileyChatTransport: () => 'transport-stub',
}));

vi.mock('../hooks/useBaileyThemeBridge', () => ({
    useBaileyThemeBridge: vi.fn(),
}));

vi.mock('./BaileyTable', () => ({ default: () => <div data-testid="bailey-table" /> }));
vi.mock('./BaileyChart', () => ({ default: () => <div data-testid="bailey-chart" /> }));

function renderContainer() {
    return render(
        <EnvContext.Provider
            value={{
                fhirUrl: 'https://fhir.example.com',
                AUTH_PROVIDERS: '',
                FHIR_APP_VERSION: 'null',
                AWS_REGION: '',
                baileyUrl: 'https://bailey.example.com',
                baileyModel: 'gpt-5',
                baileyEnabled: true,
                getFhirServerVersion: () => 'null',
            }}
        >
            <ThemeContextProvider>
                <BaileyChatContainer />
            </ThemeContextProvider>
        </EnvContext.Provider>
    );
}

describe('BaileyChatContainer', () => {
    it('wires the transport, model, and instructions into useBaileyChat', () => {
        renderContainer();

        expect(screen.getByTestId('bailey-chat-panel')).toBeInTheDocument();
        expect(useBaileyChatMock).toHaveBeenCalledWith(
            expect.objectContaining({
                transport: 'transport-stub',
                model: 'gpt-5',
                tools: [{ type: 'mcp', server_url: 'https://fhir.example.com/mcp', server_label: 'fhir-server' }],
            })
        );
    });

    it('renders tables and charts through BaileyTable/BaileyChart', () => {
        renderContainer();

        const { renderTable, renderChart } = baileyChatPanelPropsSpy.mock.calls[0][0];
        render(renderTable({ headers: ['a'], rows: [] }));
        render(renderChart({ type: 'bar', data: { labels: [], datasets: [] } }));

        expect(screen.getByTestId('bailey-table')).toBeInTheDocument();
        expect(screen.getByTestId('bailey-chart')).toBeInTheDocument();
    });
});
