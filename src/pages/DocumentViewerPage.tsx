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

    // Set when a specific content[] row's "View" link was clicked (e.g. from DocumentContent on
    // the DocumentReference detail page), so that one attachment can be isolated rather than
    // showing every content entry stacked together. Carried as a trailing path segment (e.g.
    // .../DocumentReference/{id}/0) to match the FHIR path-segment convention, rather than a
    // query parameter — it's only ever a plain index, never a real FHIR sub-operation, so a
    // purely-numeric `operation` segment is repurposed as the content index instead of being
    // appended to the resource URL below. No segment at all defaults to the first entry (index 0)
    // rather than falling back to showing every entry stacked.
    const contentIndex = operation === undefined ? 0 : /^\d+$/.test(operation) ? Number(operation) : undefined;

    const relativeUrl = useMemo(() => {
        if (!resourceType) {
            return '';
        }
        let url = `/4_0_0/${resourceType}`;
        if (id) {
            url += `/${id}`;
        }
        if (operation && contentIndex === undefined) {
            url += `/${operation}`;
        }
        return url;
    }, [resourceType, id, operation, contentIndex]);

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
