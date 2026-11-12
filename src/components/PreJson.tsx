import React from 'react';
import JsonView from 'react18-json-view';
import { Box, IconButton, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { saveAs } from 'file-saver';
import 'react18-json-view/src/style.css';
import 'react18-json-view/src/dark.css';
import { useTheme } from '../context/ThemeContext';

const DEFAULT_FILENAME = 'response.json';

const deriveFilename = (data: Record<string, unknown>): string => {
    const { resourceType, id } = data;
    if (typeof resourceType !== 'string') {
        return DEFAULT_FILENAME;
    }
    return typeof id === 'string' ? `${resourceType}-${id}.json` : `${resourceType}.json`;
};

interface PreJsonProps {
    data: Object | String | null;
    collapsed?: boolean | number;
    filename?: string;
}

const PreJson = ({ data, collapsed, filename }: PreJsonProps): React.ReactElement => {
    const { isDarkMode } = useTheme();

    if (!data || typeof data !== 'object') {
        return <></>;
    }

    const downloadJson = (): void => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        saveAs(blob, filename ?? deriveFilename(data as Record<string, unknown>));
    };

    return (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Tooltip title="Download JSON" arrow>
                    <IconButton size="small" aria-label="Download JSON" onClick={downloadJson}>
                        <DownloadIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
            <JsonView
                src={data}
                theme="vscode"
                dark={isDarkMode}
                collapsed={collapsed}
                style={{ fontSize: '13px' }}
            />
        </>
    );
};

export default PreJson;
