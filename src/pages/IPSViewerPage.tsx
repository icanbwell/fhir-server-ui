// filepath: /Users/imranqureshi/git/fhir-server.ui/src/pages/IPSViewerPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { Box } from '@mui/material';
import IPSViewer from '../components/IPSViewer';
import Header from '../components/Header';
import Footer from '../components/Footer';

const IPSViewerPage: React.FC = () => {
    const { resourceType, id, operation } = useParams<{
        resourceType: string;
        id?: string;
        operation?: string;
    }>();

    const [relativeUrl, setRelativeUrl] = useState<string>('');

    // Set page title and construct relative URL when component mounts or params change
    useEffect(() => {
        if (resourceType) {
            document.title = id ? `${resourceType}/${id} IPS` : (resourceType ?? 'IPS Viewer');
            let url = `/4_0_0/${resourceType}`;

            if (id) {
                url += `/${id}`;
            }

            if (operation) {
                url += `/${operation}`;
            }

            // include query parameters if present
            const queryString = new URLSearchParams(location.search);
            if (queryString.toString()) {
                url += `?${queryString}`;
            }

            setRelativeUrl(url);
        }

        // Reset title when component unmounts
        return () => {
            document.title = 'FHIR Viewer';
        };
    }, [resourceType, id, operation]);

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
                margin: 0,
                padding: 0,
                boxSizing: 'border-box',
            }}
        >
            <Header />
            <Box
                sx={{
                    flex: 1,
                    width: '100%',
                    padding: '20px',
                    boxSizing: 'border-box',
                }}
            >
                {relativeUrl && <IPSViewer relativeUrl={relativeUrl} />}
            </Box>
            <Footer />
        </Box>
    );
};

export default IPSViewerPage;
