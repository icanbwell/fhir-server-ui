import React, { useEffect, useRef, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
// Vite emits this as a same-origin, content-hashed asset — not a blob: worker — so it needs
// no CSP allowance beyond what's already granted to this app's own script origin.
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

interface PdfPreviewProps {
    blob: Blob;
}

// Split into its own module (rather than living inline in AttachmentPreview) so
// react-pdf/pdf.js — a large dependency — is only fetched when a PDF attachment is
// actually opened, via the React.lazy() import in AttachmentPreview.
const PdfPreview: React.FC<PdfPreviewProps> = ({ blob }) => {
    const [error, setError] = useState<string | null>(null);
    const [numPages, setNumPages] = useState<number>(0);
    const [containerWidth, setContainerWidth] = useState<number>();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setError(null);
        setNumPages(0);
    }, [blob]);

    // Track the preview container's width so pdf.js renders pages at a matching scale
    // instead of a fixed size that overflows or under-fills the panel.
    useEffect(() => {
        if (!containerRef.current) {
            return;
        }
        const observer = new ResizeObserver(([entry]) => {
            if (entry) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(containerRef.current);
        return () => observer.disconnect();
    }, []);

    if (error) {
        return <Alert severity="warning">{error}</Alert>;
    }

    return (
        <Box ref={containerRef} sx={{ width: '100%' }}>
            <Document
                file={blob}
                loading={<Typography color="text.secondary">Loading PDF…</Typography>}
                onLoadSuccess={({ numPages: loadedPages }) => setNumPages(loadedPages)}
                onLoadError={() => setError('Failed to render this PDF — use Download instead.')}
            >
                {Array.from({ length: numPages }, (_, index) => (
                    <Page key={index} pageNumber={index + 1} width={containerWidth} />
                ))}
            </Document>
        </Box>
    );
};

export default PdfPreview;
