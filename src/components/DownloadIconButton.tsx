import React from 'react';
import { Alert, Link, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { StreamProgressState } from '../hooks/useStreamProgress';
import StreamProgressIndicator from './StreamProgressIndicator';

interface DownloadIconButtonProps {
    tooltip?: string;
    isLoading: boolean;
    errorMessage: string | null;
    progress: StreamProgressState;
    onClick: (e: React.MouseEvent) => void;
}

// Shared chrome for FileDownload.tsx and DownloadEverythingButton.tsx — both fetch different
// content via different BaseApi calls, but render the same icon-button/progress/error UI.
const DownloadIconButton: React.FC<DownloadIconButtonProps> = ({
    tooltip = 'Download',
    isLoading,
    errorMessage,
    progress,
    onClick,
}) => (
    <React.Fragment>
        {errorMessage && (
            <Alert severity="error" sx={{ my: 2 }}>
                {errorMessage}
            </Alert>
        )}
        {isLoading && <StreamProgressIndicator progress={progress} />}
        <Tooltip title={tooltip} arrow>
            <Link
                component="button"
                onClick={onClick}
                disabled={isLoading}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1,
                }}
            >
                <DownloadIcon fontSize="small" />
            </Link>
        </Tooltip>
    </React.Fragment>
);

export default DownloadIconButton;
