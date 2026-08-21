import { useContext, useMemo } from 'react';
import { BaileyChatPanel, useBaileyChat, type BaileyMcpToolConfig } from '@icanbwell/baileyai-chat-ui';
import '@icanbwell/baileyai-chat-ui/styles.css';
import { useBaileyChatTransport } from '../hooks/useBaileyChatTransport';
import { useBaileyThemeBridge } from '../hooks/useBaileyThemeBridge';
import EnvContext from '../context/EnvironmentContext';
import { BAILEY_MCP_SERVER_LABEL, BAILEY_SYSTEM_INSTRUCTIONS } from '../constants/baileyConstants';
import BaileyTable from './BaileyTable';
import BaileyChart from './BaileyChart';

const BaileyChatContainer = () => {
    const { fhirUrl, baileyModel } = useContext(EnvContext);
    const transport = useBaileyChatTransport();
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
            renderTable={(data) => <BaileyTable headers={data.headers} rows={data.rows} />}
            renderChart={(spec) => <BaileyChart spec={spec} />}
        />
    );
};

export default BaileyChatContainer;
