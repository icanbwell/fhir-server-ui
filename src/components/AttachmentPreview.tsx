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

// Content types with a dedicated, non-text renderer below. Anything else falls back to a
// plain-text render (rather than a dead "preview not available" message) — most FHIR
// attachment content types (json, xml, plain text, and plenty of undeclared/unknown ones)
// are text underneath, and even genuinely binary content that lands here at least shows
// something instead of nothing, with Download always available regardless.
const hasDedicatedRenderer = (contentType: string) =>
    contentType === 'text/html' ||
    contentType === 'application/pdf' ||
    contentType.startsWith('image/') ||
    contentType === 'text/rtf' ||
    contentType === 'application/rtf';

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachment }) => {
    const { fhirUrl } = React.useContext(EnvironmentContext);
    const { setUserDetails } = React.useContext(UserContext);
    const baseApi = useMemo(() => new BaseApi({ fhirUrl, setUserDetails }), [fhirUrl, setUserDetails]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [rawErrorContent, setRawErrorContent] = useState<string | null>(null);
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
        setRawErrorContent(null);
        setBlob(null);
        setExternalUrl(null);

        resolveAttachmentContent(attachment, baseApi, fhirUrl)
            .then((result) => {
                if (cancelled) {
                    return;
                }
                if (result.kind === 'resolved') {
                    setBlob(result.content.blob);
                } else if (result.kind === 'external') {
                    setExternalUrl(result.externalUrl);
                } else if (result.reason === 'malformed') {
                    setErrorMessage(`This attachment’s content could not be decoded — it may be corrupted. (${result.detail})`);
                    setRawErrorContent(result.rawContent ?? null);
                } else {
                    setErrorMessage('This attachment has no retrievable content.');
                }
            })
            .catch((error: unknown) => {
                if (cancelled) {
                    return;
                }
                const status = (error as { status?: number })?.status;
                const message = error instanceof Error ? error.message : String(error);
                setErrorMessage(`Failed to load the attachment content: ${message}${status ? ` (HTTP ${status})` : ''}`);
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

    // Decoded text for html preview, and as the fallback render for every content type
    // without its own dedicated renderer below.
    useEffect(() => {
        if (!blob || !(contentType === 'text/html' || !hasDedicatedRenderer(contentType))) {
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
        if (contentType === 'application/pdf' && objectUrl) {
            return <Box component="iframe" src={objectUrl} sx={{ width: '100%', height: '80vh', border: 'none' }} />;
        }
        if (contentType.startsWith('image/') && objectUrl) {
            return <Box component="img" src={objectUrl} sx={{ maxWidth: '100%' }} />;
        }
        if (contentType === 'text/rtf' || contentType === 'application/rtf') {
            return rtfError ? <Alert severity="warning">{rtfError}</Alert> : <div ref={rtfContainerRef} />;
        }
        // Fallback for everything without a dedicated renderer above (json, xml, plain text,
        // and any undeclared/unknown content type) — show it as text rather than a dead end.
        return (
            <Box component="pre" sx={{ whiteSpace: 'pre-wrap', overflow: 'auto', maxHeight: '80vh' }}>
                {textContent}
            </Box>
        );
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
            {!isLoading && errorMessage && rawErrorContent && (
                <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        Raw content received (for debugging):
                    </Typography>
                    <Box
                        component="pre"
                        sx={{
                            whiteSpace: 'pre-wrap',
                            overflow: 'auto',
                            maxHeight: '40vh',
                            m: 0,
                            p: 1,
                            bgcolor: 'grey.100',
                            border: '1px solid',
                            borderColor: 'grey.300',
                            borderRadius: 1,
                            fontSize: '0.75rem',
                        }}
                    >
                        {rawErrorContent}
                    </Box>
                </Box>
            )}
            {!isLoading && !errorMessage && renderPreview()}
        </Paper>
    );
};

export default AttachmentPreview;
