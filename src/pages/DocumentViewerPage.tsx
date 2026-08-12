import React, { useMemo } from 'react';
import { useParams } from 'react-router';
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

    return (
        <Box sx={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Header />
            <Box sx={{ flex: 1, width: '100%', padding: '20px', boxSizing: 'border-box' }}>
                {relativeUrl && <DocumentViewer relativeUrl={relativeUrl} />}
            </Box>
            <Footer />
        </Box>
    );
};

export default DocumentViewerPage;
