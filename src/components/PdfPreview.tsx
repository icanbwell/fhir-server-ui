import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, IconButton, Stack, Typography } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
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
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [containerWidth, setContainerWidth] = useState<number>();

    useEffect(() => {
        setError(null);
        setNumPages(0);
        setPageNumber(1);
    }, [blob]);

    // Track the preview container's width so pdf.js renders pages at a matching scale
    // instead of a fixed size that overflows or under-fills the panel. A callback ref (rather
    // than a ref object read inside a `[]`-deps effect) re-attaches automatically whenever
    // React swaps in a new DOM node — which happens here whenever this component toggles
    // between its error Alert and its success Box, since that unmounts/remounts the observed
    // node while this component instance itself persists across document navigation.
    const containerRef = useCallback((node: HTMLDivElement | null) => {
        if (!node) {
            return;
        }
        const observer = new ResizeObserver(([entry]) => {
            if (entry) {
                setContainerWidth(entry.contentRect.width);
            }
        });
        observer.observe(node);
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
                {/* Renders only the current page rather than every page at once — a multi-page
                    scanned document (a common shape for FHIR DocumentReference/Binary
                    attachments) would otherwise queue that many concurrent pdf.js
                    rasterizations and live canvases simultaneously. */}
                {numPages > 0 && <Page pageNumber={pageNumber} width={containerWidth} />}
            </Document>
            {numPages > 1 && (
                <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton
                        size="small"
                        aria-label="Previous page"
                        disabled={pageNumber <= 1}
                        onClick={() => setPageNumber((current) => current - 1)}
                    >
                        <ChevronLeftIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" color="text.secondary">
                        Page {pageNumber} of {numPages}
                    </Typography>
                    <IconButton
                        size="small"
                        aria-label="Next page"
                        disabled={pageNumber >= numPages}
                        onClick={() => setPageNumber((current) => current + 1)}
                    >
                        <ChevronRightIcon fontSize="small" />
                    </IconButton>
                </Stack>
            )}
        </Box>
    );
};

export default PdfPreview;
