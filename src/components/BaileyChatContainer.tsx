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
import { BAILEY_MCP_SERVER_LABEL, BAILEY_SYSTEM_INSTRUCTIONS } from '../constants/baileyConstants';
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
    });

    return (
        <BaileyChatPanel
            chat={chat}
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
