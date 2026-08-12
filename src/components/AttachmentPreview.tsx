import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Box, Link, Paper, Tooltip, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DOMPurify from 'dompurify';
import { saveAs } from 'file-saver';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import BaseApi from '../api/baseApi';
import { TAttachment } from '../types/partials/Attachment';
import { extensionForContentType, resolveAttachmentContent } from '../utils/attachment.utils';

interface AttachmentPreviewProps {
    attachment: TAttachment;
}

const isTextLike = (contentType: string) =>
    contentType === 'text/plain' || contentType === 'application/xml' || contentType === 'text/xml';

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment }) => {
    const { fhirUrl } = React.useContext(EnvironmentContext);
    const { setUserDetails } = React.useContext(UserContext);
    const baseApi = useMemo(() => new BaseApi({ fhirUrl, setUserDetails }), [fhirUrl, setUserDetails]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [blob, setBlob] = useState<Blob | null>(null);
    const [externalUrl, setExternalUrl] = useState<string | null>(null);
    const [textContent, setTextContent] = useState<string>('');
    const [objectUrl, setObjectUrl] = useState<string | null>(null);
    const [rtfError, setRtfError] = useState<string | null>(null);
    const rtfContainerRef = useRef<HTMLDivElement>(null);

    const contentType = String(attachment.contentType || 'application/octet-stream')
        .toLowerCase()
        .split(';')[0]
        .trim();

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setErrorMessage(null);
        setBlob(null);
        setExternalUrl(null);

        resolveAttachmentContent(attachment, baseApi)
            .then((result) => {
                if (cancelled) {
                    return;
                }
                if (result.kind === 'resolved') {
                    setBlob(result.content.blob);
                } else if (result.kind === 'external') {
                    setExternalUrl(result.externalUrl);
                } else {
                    setErrorMessage('This attachment has no retrievable content.');
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setErrorMessage('Failed to load the attachment content.');
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
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [attachment.data, attachment.url, attachment.contentType]);

    // Object URL for image/PDF preview — must be revoked on cleanup or attachment change
    // to avoid leaking memory across repeated views.
    useEffect(() => {
        if (!blob || !(contentType === 'application/pdf' || contentType.startsWith('image/'))) {
            setObjectUrl(null);
            return;
        }
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [blob, contentType]);

    // Decoded text for html/plain/xml preview.
    useEffect(() => {
        if (!blob || !(contentType === 'text/html' || isTextLike(contentType))) {
            setTextContent('');
            return;
        }
        let cancelled = false;
        blob.text().then((text) => {
            if (!cancelled) {
                setTextContent(text);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [blob, contentType]);

    // RTF preview via rtf.js — renders directly into the DOM (not React elements), so it
    // owns its own ref rather than going through JSX.
    useEffect(() => {
        setRtfError(null);
        if (!blob || (contentType !== 'text/rtf' && contentType !== 'application/rtf')) {
            return;
        }
        let cancelled = false;
        (async () => {
            try {
                const buffer = await blob.arrayBuffer();
                const { RTFJS } = await import('rtf.js');
                RTFJS.loggingEnabled(false);
                const doc = new RTFJS.Document(buffer);
                const elements = await doc.render();
                if (!cancelled && rtfContainerRef.current) {
                    rtfContainerRef.current.replaceChildren(...elements);
                }
            } catch {
                if (!cancelled) {
                    setRtfError('Failed to render this RTF document — use Download instead.');
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [blob, contentType]);

    const handleDownload = () => {
        if (!blob) {
            return;
        }
        const filename = attachment.title
            ? String(attachment.title)
            : `document.${extensionForContentType(contentType)}`;
        saveAs(blob, filename);
    };

    const renderPreview = () => {
        if (!blob) {
            return null;
        }
        if (contentType === 'text/html') {
            return <Box sx={{ '& a': { color: 'primary.main' } }} dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(textContent) }} />;
        }
        if (isTextLike(contentType)) {
            return (
                <Box component="pre" sx={{ whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '80vh' }}>
                    {textContent}
                </Box>
            );
        }
        if (contentType === 'application/pdf' && objectUrl) {
            return <Box component="iframe" src={objectUrl} sx={{ width: '100%', height: '80vh', border: 'none' }} />;
        }
        if (contentType.startsWith('image/') && objectUrl) {
            return <Box component="img" src={objectUrl} sx={{ maxWidth: '100%' }} />;
        }
        if (contentType === 'text/rtf' || contentType === 'application/rtf') {
            return rtfError ? <Alert severity="warning">{rtfError}</Alert> : <div ref={rtfContainerRef} />;
        }
        return <Alert severity="info">Preview not available for {contentType} — use Download to save the file.</Alert>;
    };

    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                <Typography variant="subtitle1">{attachment.title ? String(attachment.title) : 'Untitled document'}</Typography>
                <Typography variant="body2" color="text.secondary">
                    {contentType}
                    {attachment.size ? ` · ${attachment.size} bytes` : ''}
                    {attachment.creation ? ` · ${attachment.creation}` : ''}
                </Typography>
                <Box sx={{ flexGrow: 1 }} />
                {blob && (
                    <Tooltip title="Download">
                        <Link component="button" onClick={handleDownload} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <DownloadIcon fontSize="small" /> Download
                        </Link>
                    </Tooltip>
                )}
                {externalUrl && (
                    <Link href={externalUrl} target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Open externally <OpenInNewIcon fontSize="small" />
                    </Link>
                )}
            </Box>
            {isLoading && <Typography color="text.secondary">Loading…</Typography>}
            {!isLoading && errorMessage && <Alert severity="error">{errorMessage}</Alert>}
            {!isLoading && !errorMessage && renderPreview()}
        </Paper>
    );
};

export default AttachmentPreview;
