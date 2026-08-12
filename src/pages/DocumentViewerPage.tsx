import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { Box } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import DocumentViewer from '../components/DocumentViewer';

const DocumentViewerPage: React.FC = () => {
    const { resourceType, id, operation } = useParams<{
        resourceType: string;
        id?: string;
        operation?: string;
    }>();
    const [searchParams] = useSearchParams();

    const relativeUrl = useMemo(() => {
        if (!resourceType) {
            return '';
        }
        let url = `/4_0_0/${resourceType}`;
        if (id) {
            url += `/${id}`;
        }
        if (operation) {
            url += `/${operation}`;
        }
        return url;
    }, [resourceType, id, operation]);

    // Set when a specific content[] row's "View" link was clicked (e.g. from DocumentContent on
    // the DocumentReference detail page), so that one attachment can be isolated rather than
    // showing every content entry stacked together.
    const contentParam = searchParams.get('content');
    const contentIndex = contentParam !== null && /^\d+$/.test(contentParam) ? Number(contentParam) : undefined;

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <Box sx={{ flex: 1, width: '100%', padding: '20px', boxSizing: 'border-box' }}>
                {relativeUrl && <DocumentViewer relativeUrl={relativeUrl} contentIndex={contentIndex} />}
            </Box>
            <Footer />
        </Box>
    );
};

export default DocumentViewerPage;
