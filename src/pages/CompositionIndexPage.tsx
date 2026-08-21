import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { Alert, Box, Button, TextField } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CompositionIndex from '../components/CompositionIndex';
import PreJson from '../components/PreJson';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import LastRequestContext from '../context/LastRequestContext';
import BaseApi from '../api/baseApi';
import { TComposition } from '../types/resources/Composition';
import { buildCompositionMatrix, normalizePersonId, parsePersonReference } from '../utils/compositionIndex';
import { formatHumanName } from '../utils/humanName';
import { useStreamProgress } from '../hooks/useStreamProgress';
import StreamProgressIndicator from '../components/StreamProgressIndicator';

// Requesting one page over what a single person plausibly has (roughly one Composition per
// category per version). If this ever gets hit, results are silently incomplete without the
// note rendered below — see the `isPossiblyTruncated` check.
const PAGE_SIZE = 100;

const CompositionIndexPage: React.FC = () => {
    const { personId } = useParams<{ personId?: string }>();
    const navigate = useNavigate();

    const [personIdDraft, setPersonIdDraft] = useState('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [compositions, setCompositions] = useState<TComposition[] | null>(null);
    const [isPossiblyTruncated, setIsPossiblyTruncated] = useState<boolean>(false);
    const [rawResponse, setRawResponse] = useState<Object | null>(null);
    // Best-effort only - a failure to resolve a display name falls back to the raw
    // person/patient id (below) rather than blocking or erroring the page.
    const [personName, setPersonName] = useState<string | undefined>(undefined);

    const { progress, start, onProgress, finish } = useStreamProgress();

    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const { recordRequest } = useContext(LastRequestContext);

    const baseApi = useMemo(
        () => new BaseApi({ fhirUrl, setUserDetails, onRequest: recordRequest }),
        [fhirUrl, setUserDetails, recordRequest]
    );

    // Trimmed only - NOT run through normalizePersonId here. ResourceCard already encodes
    // Patient-vs-Person unambiguously in the URL itself (bare id vs "person."-prefixed id);
    // defaulting a bare id to Person here would silently break every Patient-card entry point
    // (a bare Patient uuid used as-is would search Person's compartment instead of the
    // Patient's). normalizePersonId is for the "Go" button's free-text entry only - see
    // handleGoToPersonId below.
    const trimmedPersonId = useMemo(() => personId?.trim() || undefined, [personId]);

    const personRef = useMemo(
        () => (trimmedPersonId ? parsePersonReference(trimmedPersonId) : undefined),
        [trimmedPersonId]
    );

    const relativeUrl = useMemo(() => {
        if (!personRef) {
            return '';
        }
        const params = new URLSearchParams({
            patient: personRef.searchValue,
            _count: String(PAGE_SIZE),
            _elements: 'id,meta,type,title,date,status',
        });
        return `/4_0_0/Composition?${params}`;
    }, [personRef]);

    const personResourceUrl = useMemo(() => {
        if (!personRef) {
            return '';
        }
        return `/4_0_0/${personRef.resourceType}/${personRef.bareId}?_elements=name`;
    }, [personRef]);

    const personLabel = personName ?? trimmedPersonId;

    useEffect(() => {
        document.title = personLabel ? `Compositions for ${personLabel}` : 'Compositions';
        return () => {
            document.title = 'FHIR Viewer';
        };
    }, [personLabel]);

    useEffect(() => {
        if (!relativeUrl) {
            setCompositions(null);
            return;
        }

        let cancelled = false;

        const fetchCompositions = async () => {
            setIsLoading(true);
            setErrorMessage(null);
            setIsPossiblyTruncated(false);
            start();
            try {
                const response = await baseApi.getData({ urlString: relativeUrl }, { onProgress });
                if (cancelled) {
                    return;
                }
                const json = response.json;
                setRawResponse(json);
                if (json?.resourceType === 'Bundle') {
                    const entries: TComposition[] = (json.entry ?? [])
                        .map((entry: { resource?: TComposition }) => entry.resource)
                        .filter((resource: TComposition | undefined): resource is TComposition =>
                            resource?.resourceType === 'Composition'
                        );
                    setCompositions(entries);
                    setIsPossiblyTruncated(entries.length >= PAGE_SIZE);
                } else {
                    setCompositions(null);
                    setErrorMessage('The FHIR server did not return a searchset Bundle');
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Error fetching Compositions:', error);
                    setErrorMessage('Failed to load Compositions for this person');
                }
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                    finish();
                }
            }
        };

        fetchCompositions();

        return () => {
            cancelled = true;
        };
    }, [relativeUrl, baseApi, onProgress, start, finish]);

    // Independent of the Composition fetch above - a slow, failed, or 404 name lookup should
    // never block or error the page, only leave personLabel falling back to the raw id.
    useEffect(() => {
        if (!personResourceUrl) {
            setPersonName(undefined);
            return;
        }

        let cancelled = false;

        const fetchPersonName = async () => {
            try {
                const response = await baseApi.getData({ urlString: personResourceUrl });
                if (!cancelled) {
                    setPersonName(formatHumanName(response.json?.name));
                }
            } catch (error) {
                if (!cancelled) {
                    console.error('Error fetching Person/Patient name:', error);
                    setPersonName(undefined);
                }
            }
        };

        fetchPersonName();

        return () => {
            cancelled = true;
        };
    }, [personResourceUrl, baseApi]);

    const handleGoToPersonId = () => {
        if (personIdDraft.trim()) {
            // Defaults a bare paste to a Person id (Bug Bash's typical case) - see
            // normalizePersonId. This is the one intended call site for that default.
            navigate(`/compositions/4_0_0/${encodeURIComponent(normalizePersonId(personIdDraft))}`);
        }
    };

    const matrix = useMemo(() => (compositions ? buildCompositionMatrix(compositions) : null), [
        compositions,
    ]);

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
                {!trimmedPersonId && (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', maxWidth: 480 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Person client ID"
                            placeholder="cc362570-1c65-4535-9d74-a9328debbb89"
                            value={personIdDraft}
                            onChange={(e) => setPersonIdDraft(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGoToPersonId()}
                        />
                        <Button variant="contained" onClick={handleGoToPersonId}>
                            Go
                        </Button>
                    </Box>
                )}

                {isLoading && (
                    <Box sx={{ my: 4 }}>
                        <StreamProgressIndicator progress={progress} />
                    </Box>
                )}

                {!isLoading && isPossiblyTruncated && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Showing the first {PAGE_SIZE} Compositions — results may be truncated.
                    </Alert>
                )}

                {!isLoading && errorMessage && (
                    <>
                        <Alert severity="error">{errorMessage}</Alert>
                        {rawResponse && <PreJson data={rawResponse} />}
                    </>
                )}

                {!isLoading && !errorMessage && matrix && (
                    <CompositionIndex personLabel={personLabel!} matrix={matrix} />
                )}
            </Box>
            <Footer />
        </Box>
    );
};

export default CompositionIndexPage;
