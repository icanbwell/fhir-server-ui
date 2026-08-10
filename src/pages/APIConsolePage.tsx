import { useCallback, useContext, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { Box } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FhirRequestConsole, { SendRequestParams } from '../components/FhirRequestConsole';
import FhirApi from '../api/fhirApi';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import { HttpMethod } from '../context/LastRequestContext';
import { getLocalData } from '../utils/localData.utils';

const APIConsolePage = () => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const { id: routeId, resourceType: routeResourceType, operation: routeOperation } = useParams();

    const [searchParams, setSearchParams] = useSearchParams();

    // Determine if we arrived from a ResourceCard redirect (route params present)
    const isFromRedirect = Boolean(routeId && routeResourceType && routeOperation);

    const [method, setMethod] = useState<HttpMethod>(
        (searchParams.get('method') as HttpMethod) || (isFromRedirect ? 'POST' : 'GET')
    );
    const [urlSuffix, setUrlSuffix] = useState<string>(
        isFromRedirect && routeResourceType && routeId && routeOperation
            ? `/4_0_0/${routeResourceType}/${routeId}/${routeOperation}?smartMerge=true`
            : searchParams.get('urlSuffix') || ''
    );
    const [resourceJson, setResourceJson] = useState<string>('');
    const [fetching, setFetching] = useState<boolean>(false);

    // Sync state to search params (only for standalone /api-console route)
    useEffect(() => {
        if (isFromRedirect) {
            return;
        }
        const newParams: Record<string, string> = {};
        if (method && method !== 'GET') {
            newParams.method = method;
        }
        if (urlSuffix) {
            newParams.urlSuffix = urlSuffix;
        }
        setSearchParams(newParams, { replace: true });
    }, [method, urlSuffix, isFromRedirect, setSearchParams]);

    // Auto-fetch resource when arriving from ResourceCard redirect
    useEffect(() => {
        if (!isFromRedirect || !fhirUrl || !routeId || !routeResourceType) {
            return;
        }
        const fetchResource = async () => {
            try {
                setFetching(true);
                const identityProvider = getLocalData('identityProvider');
                if (!identityProvider) {
                    return;
                }
                const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
                const { json } = await fhirApi.getResource({ id: routeId, resourceType: routeResourceType });
                if (json) {
                    setResourceJson(JSON.stringify(json, null, 2));
                }
            } catch (error) {
                console.error('Failed to fetch resource:', error);
            } finally {
                setFetching(false);
            }
        };
        fetchResource();
    }, [fhirUrl, routeId, routeResourceType, isFromRedirect, setUserDetails]);

    const sendRequest = useCallback(
        (params: SendRequestParams) => new FhirApi({ fhirUrl, setUserDetails }).sendRequest(params),
        [fhirUrl, setUserDetails]
    );

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    <FhirRequestConsole
                        method={method}
                        onMethodChange={setMethod}
                        urlSuffix={urlSuffix}
                        onUrlSuffixChange={setUrlSuffix}
                        resourceJson={resourceJson}
                        onResourceJsonChange={setResourceJson}
                        requestPathPlaceholder="Full path, e.g. /4_0_0/Patient/123 or /version"
                        sendRequest={sendRequest}
                        sendDisabled={fetching}
                        loadingRequestBody={fetching}
                    />
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default APIConsolePage;
