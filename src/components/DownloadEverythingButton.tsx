import React, { useContext, useMemo, useState } from 'react';
import { Alert, Link, Tooltip } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { saveAs } from 'file-saver';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import BaseApi from '../api/baseApi';
import { useStreamProgress } from '../hooks/useStreamProgress';
import StreamProgressIndicator from './StreamProgressIndicator';

interface DownloadEverythingButtonProps {
    resourceType: 'Patient' | 'Person';
    // Matches TBaseResourceProps['id'] (boxed String, possibly undefined) — the same type
    // `uuid` carries in the generated Person.tsx/Patient.tsx that render this button.
    id?: String;
}

// $everything bundles can be large enough that buffering the whole response through
// request()'s JSON.parse (then re-stringifying it) risks the tab looking hung with no
// feedback. This streams the raw bytes straight to a Blob via BaseApi.downloadFile — the
// same mechanism FileDownload.tsx uses for large attachments — with progress reported as
// bytes arrive, and writes them out with no intermediate JSON parse at all.
const DownloadEverythingButton: React.FC<DownloadEverythingButtonProps> = ({ resourceType, id }) => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const baseApi = useMemo(() => new BaseApi({ fhirUrl, setUserDetails }), [fhirUrl, setUserDetails]);
    const { progress, start, onProgress, finish } = useStreamProgress();

    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const downloadEverything = async (e: React.MouseEvent): Promise<void> => {
        e.preventDefault();
        if (!id) {
            return;
        }
        const resourceId = String(id);
        setIsLoading(true);
        setErrorMessage(null);
        start();
        try {
            const urlString = `/4_0_0/${resourceType}/$everything`;
            const response = await baseApi.downloadFile(urlString, {
                params: { id: resourceId, _format: 'json', contained: 'true' },
                onProgress,
            });
            saveAs(response.data, `${resourceType}-${resourceId}-everything.json`);
        } catch (error1: unknown) {
            console.error(`Error downloading $everything for ${resourceType}/${id}:`, error1);
            setErrorMessage(
                `An error occurred while downloading $everything: ${(error1 as Error).message}`
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
            <Tooltip title="Download $everything" arrow>
                <Link
                    component="button"
                    onClick={downloadEverything}
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

export default DownloadEverythingButton;
