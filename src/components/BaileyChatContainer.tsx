import { useContext, useMemo } from 'react';
import { BaileyChatPanel, useBaileyChat, type BaileyMcpToolConfig } from '@icanbwell/baileyai-chat-ui';
import '@icanbwell/baileyai-chat-ui/styles.css';
import { BaileyTable } from '@icanbwell/baileyai-chat-ui/table';
import { BaileyChart } from '@icanbwell/baileyai-chat-ui/chart';
import { useBaileyChatTransport } from '../hooks/useBaileyChatTransport';
import { useBaileyThemeBridge } from '../hooks/useBaileyThemeBridge';
import { useAgGridBrandTheme } from '../hooks/useAgGridBrandTheme';
import { useTheme } from '../context/ThemeContext';
import EnvContext from '../context/EnvironmentContext';
import { BAILEY_MCP_SERVER_LABEL, BAILEY_SUGGESTIONS, BAILEY_SYSTEM_INSTRUCTIONS } from '../constants/baileyConstants';
import { brandColors } from '../theme/brandColors';

// Passed to the package's built-in BaileyChart via its `palette` prop instead of copying its
// Chart.js setup locally — each pair chosen to stay pairwise distinguishable within its own mode.
const LIGHT_CHART_PALETTE = [
    brandColors.blue,
    brandColors.green,
    brandColors.lilac,
    brandColors.orange,
    brandColors.darkGray,
    brandColors.midGray,
    brandColors.darkBlue,
    brandColors.errorRed,
];
const DARK_CHART_PALETTE = [
    brandColors.lilac,
    brandColors.green,
    brandColors.yellow,
    brandColors.orange,
    brandColors.lightGray,
    brandColors.midGray,
    brandColors.darkModeTextSecondary,
    brandColors.errorRed,
];

const noop = () => undefined;

const BaileyChatContainer = () => {
    const { fhirUrl, baileyModel } = useContext(EnvContext);
    const { isDarkMode } = useTheme();
    const transport = useBaileyChatTransport();
    const gridTheme = useAgGridBrandTheme(isDarkMode);
    useBaileyThemeBridge();

    const tools = useMemo<BaileyMcpToolConfig[]>(
        () => [{ type: 'mcp', server_url: `${fhirUrl}/mcp`, server_label: BAILEY_MCP_SERVER_LABEL }],
        [fhirUrl]
    );

    const chat = useBaileyChat({
        transport,
        model: baileyModel,
        instructions: BAILEY_SYSTEM_INSTRUCTIONS,
        tools,
        // Internal admin tool: no resume across reload, so the held conversation id is never
        // written to browser storage.
        storage: false,
        // Send the whole transcript every turn and never a conversation id. Keeps the request
        // identical to before the library client was adopted, even if the backend reports an id.
        sendFullTranscript: true,
        // Context loss is silent by decision (BAI-1237 D6/D7): this host has no telemetry hook, and
        // the library already falls back to the full transcript. The ids embed the user's `sub`,
        // so they must never be logged or stored here.
        onContextLoss: noop,
    });

    return (
        <BaileyChatPanel
            chat={chat}
            suggestions={BAILEY_SUGGESTIONS}
            renderTable={(data) => <BaileyTable headers={data.headers} rows={data.rows} theme={gridTheme} />}
            renderChart={(spec) => (
                <BaileyChart
                    spec={spec}
                    isDarkMode={isDarkMode}
                    palette={isDarkMode ? DARK_CHART_PALETTE : LIGHT_CHART_PALETTE}
                />
            )}
        />
    );
};

export default BaileyChatContainer;
