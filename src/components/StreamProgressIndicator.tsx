import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';
import { StreamProgressState } from '../hooks/useStreamProgress';

function formatBytes(bytes: number): string {
    if (bytes < 1024) {
        return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface StreamProgressIndicatorProps {
    progress: StreamProgressState;
}

const StreamProgressIndicator: React.FC<StreamProgressIndicatorProps> = ({ progress }) => {
    if (!progress.isStreaming) {
        return null;
    }
    const percent = progress.totalBytes
        ? Math.min(100, Math.round((progress.bytesReceived / progress.totalBytes) * 100))
        : undefined;
    return (
        <Box sx={{ width: '100%', my: 2 }}>
            <LinearProgress variant={percent !== undefined ? 'determinate' : 'indeterminate'} value={percent} />
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
                {percent !== undefined
                    ? `Loading… ${formatBytes(progress.bytesReceived)} of ${formatBytes(progress.totalBytes as number)} (${percent}%)`
                    : `Loading… ${formatBytes(progress.bytesReceived)} received`}
            </Typography>
        </Box>
    );
};

export default StreamProgressIndicator;
