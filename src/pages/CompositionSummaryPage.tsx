import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { Alert, Box } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CompositionSummary from '../components/CompositionSummary';
import PreJson from '../components/PreJson';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import LastRequestContext from '../context/LastRequestContext';
import BaseApi from '../api/baseApi';
import { TComposition } from '../types/resources/Composition';
import { appendFormatJson } from '../utils/url.utils';
import { useStreamProgress } from '../hooks/useStreamProgress';
import StreamProgressIndicator from '../components/StreamProgressIndicator';

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
    const [isIncomplete, setIsIncomplete] = useState<boolean>(false);

    const { progress, start, onProgress, finish } = useStreamProgress();

    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const { recordRequest } = useContext(LastRequestContext);

    const baseApi = useMemo(
        () => new BaseApi({ fhirUrl, setUserDetails, onRequest: recordRequest }),
        [fhirUrl, setUserDetails, recordRequest]
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
            setIsIncomplete(false);
            start();
            try {
                const response = await baseApi.getData({ urlString: relativeUrl }, { onProgress });
                const json = response.json;
                setRawResponse(json);
                setIsIncomplete(response.incomplete);
                if (json?.resourceType === 'Composition') {
                    setResource(json);
                } else if (response.incomplete && !json) {
                    setErrorMessage('Connection interrupted before any data was received — please retry.');
                } else {
                    setErrorMessage('The requested resource is not a Composition');
                }
            } catch (error) {
                console.error('Error fetching Composition resource:', error);
                setErrorMessage('Failed to load the Composition resource');
            } finally {
                setIsLoading(false);
                finish();
            }
        };

        fetchResource();

        return () => {
            document.title = 'FHIR Viewer';
        };
    }, [relativeUrl, baseApi, id, resourceType, start, onProgress, finish]);

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
                    <Box sx={{ my: 4 }}>
                        <StreamProgressIndicator progress={progress} />
                    </Box>
                )}
                {!isLoading && isIncomplete && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Connection interrupted — showing partial results.
                    </Alert>
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
