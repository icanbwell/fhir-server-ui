import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import AttachmentPreview from './AttachmentPreview';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import BaseApi from '../api/baseApi';
import { TAttachment } from '../types/partials/Attachment';

interface DocumentViewerProps {
    relativeUrl: string;
    // When set, isolate this one content[] entry instead of stacking all of them — used when
    // arriving from a specific row's "View" link (e.g. DocumentContent on the DocumentReference
    // detail page) rather than a resource-level link that has no single entry in mind.
    contentIndex?: number;
}

interface FhirResource {
    resourceType?: string;
    id?: string;
    contentType?: string;
    data?: string;
    content?: Array<{ attachment: TAttachment }>;
    [key: string]: unknown;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ relativeUrl, contentIndex }) => {
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
    // Isolate the requested entry when its index is valid; otherwise (no index given, or a
    // stale/out-of-range one) fall back to showing every entry rather than a dead end.
    // contentIndex is a regex-validated (\d+) number from the URL, used only as an array index.
    // eslint-disable-next-line security/detect-object-injection
    const isolated = contentIndex !== undefined ? content[contentIndex] : undefined;
    const entriesToShow = isolated ? [isolated] : content;

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
                {`DocumentReference/${resource.id}`}
                {isolated ? ` — content ${contentIndex! + 1} of ${content.length}` : ''}
            </Typography>
            {content.length === 0 && <Alert severity="warning">This DocumentReference has no content entries.</Alert>}
            {!isolated && contentIndex !== undefined && content.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Content entry {contentIndex + 1} was requested but no longer exists — showing all entries
                    instead.
                </Alert>
            )}
            {entriesToShow.map((entry, index) => (
                <AttachmentPreview key={isolated ? contentIndex : index} attachment={entry.attachment} />
            ))}
        </Box>
    );
};

export default DocumentViewer;
