import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import AttachmentPreview from './AttachmentPreview';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import BaseApi from '../api/baseApi';
import { TAttachment } from '../types/partials/Attachment';

interface DocumentViewerProps {
    relativeUrl: string;
}

interface FhirResource {
    resourceType?: string;
    id?: string;
    contentType?: string;
    data?: string;
    content?: Array<{ attachment: TAttachment }>;
    [key: string]: unknown;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ relativeUrl }) => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const baseApi = useMemo(() => new BaseApi({ fhirUrl, setUserDetails }), [fhirUrl, setUserDetails]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [resource, setResource] = useState<FhirResource | null>(null);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setErrorMessage(null);
        baseApi
            .getData({ urlString: relativeUrl })
            .then(({ json }) => {
                if (cancelled) {
                    return;
                }
                if (json?.resourceType === 'DocumentReference' || json?.resourceType === 'Binary') {
                    setResource(json);
                } else {
                    setErrorMessage('The requested resource is not a DocumentReference or Binary.');
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setErrorMessage('Failed to load the resource.');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [relativeUrl, baseApi]);

    if (isLoading) {
        return <Typography color="text.secondary">Loading…</Typography>;
    }
    if (errorMessage || !resource) {
        return <Alert severity="error">{errorMessage || 'Resource not found.'}</Alert>;
    }

    if (resource.resourceType === 'Binary') {
        const attachment: TAttachment = {
            contentType: resource.contentType,
            data: resource.data,
            url: resource.data ? undefined : `Binary/${resource.id}`,
            title: `Binary/${resource.id}`,
        };
        return (
            <Box>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    {`Binary/${resource.id}`}
                </Typography>
                <AttachmentPreview attachment={attachment} />
            </Box>
        );
    }

    const content = resource.content || [];
    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
                {`DocumentReference/${resource.id}`}
            </Typography>
            {content.length === 0 && <Alert severity="warning">This DocumentReference has no content entries.</Alert>}
            {content.map((entry, index) => (
                <AttachmentPreview key={index} attachment={entry.attachment} />
            ))}
        </Box>
    );
};

export default DocumentViewer;
