import React, { useContext, useState } from 'react';
import { Link, Alert, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { saveAs } from 'file-saver';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import BaseApi from '../api/baseApi';
import { useStreamProgress } from '../hooks/useStreamProgress';
import StreamProgressIndicator from './StreamProgressIndicator';

interface FileDownloadProps {
    relativeUrl: string;
    format: string;
}

const FileDownload: React.FC<FileDownloadProps> = ({ relativeUrl, format }) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const { progress, start, onProgress, finish } = useStreamProgress();
    const baseApi = React.useMemo(
        () => new BaseApi({ fhirUrl, setUserDetails }),
        [fhirUrl, setUserDetails]
    );

    const downloadUri: URL = new URL(relativeUrl, fhirUrl);
    downloadUri.searchParams.set('_format', format);

    const extractFilenameFromHeader = (contentDisposition: string): string | undefined => {
        let filename: string | undefined;
        if (contentDisposition && contentDisposition.includes('filename=')) {
            const filenameMatch = contentDisposition.split('filename=')[1];
            filename = filenameMatch.split(';')[0].trim().replace(/"/g, '');
        } else if (contentDisposition && contentDisposition.includes('filename*=')) {
            const filenameMatch = contentDisposition.split("filename*=UTF-8''")[1];
            filename = decodeURIComponent(filenameMatch.split(';')[0].trim());
        }
        return filename || undefined;
    };

    const downloadFile = async (e: React.MouseEvent): Promise<void> => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMessage(null); // Clear any previous error message
        start();
        try {
            const response = await baseApi.downloadFile(downloadUri.toString(), { onProgress });

            const contentDisposition = response.headers['content-disposition'];
            if (!contentDisposition) {
                console.error('Content-Disposition header not found');
                setErrorMessage('Failed to download the file: Missing Content-Disposition header.');
                return;
            }
            const filename = extractFilenameFromHeader(contentDisposition);
            if (!filename) {
                console.error('Filename not found in Content-Disposition header');
                setErrorMessage('Filename not found in Content-Disposition header.');
                return;
            }
            saveAs(response.data, filename);
        } catch (error1: unknown) {
            console.error('Error downloading the file:', error1);
            setErrorMessage(
                `An error occurred while downloading the file: ${(error1 as Error).message}`
            );
        } finally {
            setIsLoading(false);
            finish();
        }
    };

    return (
        <React.Fragment>
            {errorMessage && (
                <Alert severity="error" sx={{ my: 2 }}>
                    {errorMessage}
                </Alert>
            )}
            {isLoading && <StreamProgressIndicator progress={progress} />}
            <Tooltip title="Download" arrow>
                <Link
                    component="button"
                    onClick={downloadFile}
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
};

export default FileDownload;
