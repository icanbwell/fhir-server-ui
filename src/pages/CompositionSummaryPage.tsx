import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Alert, Box, CircularProgress } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CompositionSummary from '../components/CompositionSummary';
import PreJson from '../components/PreJson';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import BaseApi from '../api/baseApi';
import { TComposition } from '../types/resources/Composition';
import { appendFormatJson } from '../utils/url.utils';

const CompositionSummaryPage: React.FC = () => {
    const { resourceType, id, operation } = useParams<{
        resourceType: string;
        id?: string;
        operation?: string;
    }>();

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [resource, setResource] = useState<TComposition | null>(null);
    const [rawResponse, setRawResponse] = useState<Object | null>(null);

    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);

    const baseApi = useMemo(
        () => new BaseApi({ fhirUrl, setUserDetails }),
        [fhirUrl, setUserDetails]
    );

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
        const queryString = new URLSearchParams(window.location.search);
        if (queryString.toString()) {
            url += `?${queryString}`;
        }
        return url;
    }, [resourceType, id, operation]);

    useEffect(() => {
        if (!relativeUrl) {
            return;
        }
        document.title = id ? `${resourceType}/${id} Summary` : (resourceType ?? 'Composition Summary');

        const fetchResource = async () => {
            setIsLoading(true);
            setErrorMessage(null);
            try {
                const response = await baseApi.getData({ urlString: relativeUrl });
                const json = response.json;
                setRawResponse(json);
                if (json?.resourceType === 'Composition') {
                    setResource(json);
                } else {
                    setErrorMessage('The requested resource is not a Composition');
                }
            } catch (error) {
                console.error('Error fetching Composition resource:', error);
                setErrorMessage('Failed to load the Composition resource');
            } finally {
                setIsLoading(false);
            }
        };

        fetchResource();

        return () => {
            document.title = 'FHIR Viewer';
        };
    }, [relativeUrl, baseApi, id, resourceType]);

    return (
        <Box
            sx={{
                width: '100%',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                margin: 0,
                padding: 0,
                boxSizing: 'border-box',
            }}
        >
            <Header />
            <Box sx={{ flex: 1, width: '100%', padding: '20px', boxSizing: 'border-box' }}>
                {isLoading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                        <CircularProgress />
                    </Box>
                )}
                {!isLoading && errorMessage && (
                    <>
                        <Alert severity="error">{errorMessage}</Alert>
                        {rawResponse && <PreJson data={rawResponse} />}
                    </>
                )}
                {!isLoading && !errorMessage && resource && (
                    <CompositionSummary resource={resource} rawJsonHref={appendFormatJson(relativeUrl)} />
                )}
            </Box>
            <Footer />
        </Box>
    );
};

export default CompositionSummaryPage;
