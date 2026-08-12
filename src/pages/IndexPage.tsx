import { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router';
import { Accordion, Alert, AlertTitle, Box, Button, LinearProgress, Tooltip } from '@mui/material';
import DOMPurify from 'dompurify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import ResourceList from '../components/ResourceList';
import FhirApi from '../api/fhirApi';
import SearchContainer from '../components/SearchContainer';
import PreJson from '../components/PreJson';
import EnvironmentContext from '../context/EnvironmentContext';
import { TBundle } from '../types/resources/Bundle';
import UserContext from '../context/UserContext';
import LastRequestContext from '../context/LastRequestContext';
import GridOnIcon from '@mui/icons-material/GridOn'; // New icon for spreadsheet
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getLocalData } from '../utils/localData.utils';
import APIConsolePage from './APIConsolePage';
import { createBundleEntryParser } from '../utils/incrementalBundleParser';
import { useStreamProgress } from '../hooks/useStreamProgress';
import StreamProgressIndicator from '../components/StreamProgressIndicator';

// Hard ceiling on how many resources IndexPage will hold in state / render for a single
// page load. Without this, an unbounded Bundle (e.g. a Person $summary/$everything with
// tens of thousands of entries) grows the resources array and the DOM without limit and
// can exhaust the tab's memory. Adjust if real payloads need a different ceiling.
const MAX_RESOURCES = 2000;

/**
 * IndexPage/home/ubuntu/Documents/code/EFS/fhir-server/src/pages/SearchPage.jsx
 * Note: Any route parameters are available via useParams()
 */
const IndexPage = ({ search }: { search?: boolean }) => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const { recordRequest } = useContext(LastRequestContext);
    const [resources, setResources] = useState<any>();
    const [bundle, setBundle] = useState<TBundle | undefined>();
    const [status, setStatus] = useState<number | undefined>();
    const [loading, setLoading] = useState(false);
    const [indexStart, setIndexStart] = useState(0);
    const [truncated, setTruncated] = useState(false);
    const { progress, start: startProgress, onProgress, finish: finishProgress } = useStreamProgress();

    const { id, resourceType = '', operation, vid } = useParams();

    const [searchTabExpanded, setSearchTabExpanded] = useState(false);
    const [resourceCardExpanded, setResourceCardExpanded] = useState(false);
    const [expandAll, setExpandAll] = useState(false);
    const [collapseAll, setCollapseAll] = useState(false);

    const navigate = useNavigate();

    const handleExpand = () => {
        setSearchTabExpanded(!searchTabExpanded);
    };

    const location = useLocation();
    const queryString = location.search;
    const shouldBeJsonFormat =
        (new URLSearchParams(queryString || '').get('_format') || '').toLowerCase() === 'json';

    function getBox() {
        if (loading && !resources?.length) {
            return (
                <>
                    <LinearProgress />
                    <StreamProgressIndicator progress={progress} />
                </>
            );
        }
        if (!loading && status === 401) {
            return <Box>Login Expired</Box>;
        }
        if (!loading && resources && resources.length === 0) {
            return <Box>No Results Found</Box>;
        }
        // If narrative is returned then show it at top level
        return (
            <>
                {loading && <LinearProgress />}
                {loading && <StreamProgressIndicator progress={progress} />}
                {truncated && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Showing the first {MAX_RESOURCES.toLocaleString()} resources. The full result set is
                        larger than that — narrow your search (e.g. with <code>_count</code> and{' '}
                        <code>_getpagesoffset</code>) to see the rest.
                    </Alert>
                )}
                {resources?.length > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                        <Button
                            onClick={() => {
                                setExpandAll(true);
                                setCollapseAll(false);
                            }}
                        >
                            Expand All
                        </Button>
                        <Button
                            onClick={() => {
                                setExpandAll(false);
                                setCollapseAll(true);
                            }}
                        >
                            Collapse All
                        </Button>
                    </Box>
                )}
                {/* if we have a single resource*/}
                {/* Gated on !loading: during incremental streaming, `resources` can transiently
                    have length 1 (the first entry to finish parsing) before the rest of the
                    Bundle arrives — without this guard, a resource that happens to carry a
                    narrative would flash this "Answer" banner as if it were the sole, definitive
                    result, then have it disappear once the next entry streams in. */}
                {!loading && resources && resources.length === 1 && resources[0].text?.div && (
                    <Alert severity="success">
                        <AlertTitle>Answer</AlertTitle>
                        <Box
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(resources[0].text?.div),
                            }}
                        />
                    </Alert>
                )}
                {/*if we have a list of resources*/}
                {!loading && resources && resources.length === 1 && resources[0].resource?.text?.div && (
                    <Alert severity="success">
                        <AlertTitle>Answer</AlertTitle>
                        <Box
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(resources[0].resource?.text?.div),
                            }}
                        />
                    </Alert>
                )}
                <Tooltip title="Open Search Results in New Spreadsheet Tab" arrow>
                    <Link
                        to={'/excel' + location.pathname + location.search}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            textDecoration: 'none',
                            color: 'inherit',
                        }}
                    >
                        <GridOnIcon color="primary" fontSize="small" />
                        <Typography variant="body1" color="primary">
                            Open Search Results as Spreadsheet
                        </Typography>
                        <OpenInNewIcon color="primary" />
                    </Link>
                </Tooltip>

                {resources && resources.length > 0 && (
                    <ResourceList
                        resources={resources}
                        indexStart={indexStart}
                        resourceCardExpanded={resourceCardExpanded}
                        expandAll={expandAll}
                        collapseAll={collapseAll}
                        setExpandAll={setExpandAll}
                        setCollapseAll={setCollapseAll}
                    />
                )}
            </>
        );
    }

    useEffect(() => {
        if (id) {
            setResourceCardExpanded(true);
        }
        // Guards every state write below against a request this effect has abandoned — e.g. the
        // user navigates from one resourceType/query to another before a large, slow search
        // finishes streaming. Without this, the abandoned request's onChunk callback keeps
        // calling setResources with stale data (from the OLD resourceType) for as long as its
        // download continues, and its terminal setLoading(false) can clear the loading spinner
        // for the NEW, still-in-flight request. The cleanup function below flips this once a
        // newer effect run supersedes this one.
        let cancelled = false;
        const callApi = async () => {
            document.title = 'FHIR Server';
            if (operation === '$merge' && !shouldBeJsonFormat) {
                return;
            }
            if (search) {
                setSearchTabExpanded(true);
                return;
            }
            try {
                setLoading(true);
                setTruncated(false);
                startProgress();
                if (fhirUrl) {
                    const identityProvider = getLocalData('identityProvider');
                    if (!identityProvider) {
                        // noinspection ExceptionCaughtLocallyJS
                        throw new Error('Identity provider is not set');
                    }
                    const fhirApi = new FhirApi({
                        fhirUrl,
                        setUserDetails,
                        onRequest: recordRequest,
                    });

                    let incrementalResults: any[] = [];
                    let incrementalTruncated = false;
                    let truncationSurfaced = false;
                    let parserFailed = false;
                    const streamParser = shouldBeJsonFormat
                        ? undefined
                        : createBundleEntryParser(
                              (resource) => {
                                  // Accumulate without copying per entry — the array is copied once per
                                  // network chunk (below), not once per resource, so a large Bundle
                                  // doesn't trigger one React re-render per entry. The end-of-stream full
                                  // JSON.parse result (below) still overwrites this once the response
                                  // completes, so a parser miss never leaves the page silently short of
                                  // data — it just skips the "populate live" effect for whatever wasn't
                                  // caught incrementally.
                                  if (incrementalResults.length < MAX_RESOURCES) {
                                      incrementalResults.push(resource);
                                  } else {
                                      incrementalTruncated = true;
                                  }
                              },
                              (err) => {
                                  console.error(
                                      'Incremental bundle parsing failed, falling back to full parse:',
                                      err
                                  );
                                  parserFailed = true;
                              }
                          );

                    // Render whatever the incremental parser has found so far. Batching per chunk
                    // (rather than per entry) keeps re-renders proportional to the number of network
                    // chunks received, not the number of resources in the Bundle. A no-op once this
                    // effect has been superseded, so an abandoned request can't overwrite a newer
                    // search's results while its stream keeps delivering chunks.
                    //
                    // Also a no-op once the cap has already been surfaced once — otherwise every
                    // remaining chunk of a huge response would keep re-copying and re-rendering an
                    // identical, already-capped MAX_RESOURCES-length array for as long as the download
                    // continues, which is exactly the scenario under the most memory pressure.
                    // Surfacing the capped array (and flipping the truncation banner on) once, as soon
                    // as the cap is hit, is strictly better than waiting for the whole stream to finish.
                    const surfaceIncrementalResults = () => {
                        if (cancelled || truncationSurfaced) {
                            return;
                        }
                        setResources([...incrementalResults]);
                        if (incrementalTruncated) {
                            setTruncated(true);
                            truncationSurfaced = true;
                        }
                    };

                    const {
                        json,
                        status: statusCode,
                        incomplete,
                    } = await fhirApi.getBundleAsync(
                        {
                            resourceType,
                            id,
                            queryString,
                            operation: vid ? `_history/${vid}` : operation,
                        },
                        {
                            onChunk: streamParser
                                ? (chunk) => {
                                      if (parserFailed) {
                                          return;
                                      }
                                      streamParser.write(chunk);
                                      surfaceIncrementalResults();
                                  }
                                : undefined,
                            onProgress: (bytesReceived, totalBytes) => {
                                if (!cancelled) {
                                    onProgress(bytesReceived, totalBytes);
                                }
                            },
                        }
                    );
                    streamParser?.finish();

                    if (cancelled) {
                        // A newer effect run has already taken over — don't let this abandoned
                        // request's terminal, authoritative result overwrite it.
                        return;
                    }

                    // set indexStart
                    const queryParams = new URLSearchParams(location.search || '');
                    fhirApi.addMissingRequiredParams({ queryParams, resourceType });
                    const pagesOffSet = parseInt(queryParams.get('_getpagesoffset') || '0');
                    const count = parseInt(queryParams.get('_count') || '0');
                    setIndexStart(pagesOffSet * count);

                    // noinspection JSCheckFunctionSignatures
                    setStatus(statusCode);
                    if (incomplete) {
                        console.warn(
                            'Search response was interrupted mid-stream; results may be incomplete until retried.'
                        );
                    }
                    if (shouldBeJsonFormat) {
                        setResources(json);
                    } else if (json && json.entry) {
                        const overflowing = json.entry.length > MAX_RESOURCES;
                        setResources(overflowing ? json.entry.slice(0, MAX_RESOURCES) : json.entry);
                        setTruncated(overflowing);
                        // Drop the (possibly huge) entry array before storing — `bundle` is only ever
                        // read for `bundle?.id`/`bundle?.link` (see the <Footer> call below). Keeping
                        // the full, uncapped `entry` array reachable here would retain every one of N
                        // entry objects (even 40,000+) even though `resources` above already holds the
                        // correctly-capped copy.
                        setBundle({ ...json, entry: undefined });
                        if (resourceType) {
                            document.title = resourceType;
                        }
                    } else if (incomplete && incrementalResults.length > 0) {
                        // Connection dropped before the full Bundle could be parsed, but the incremental
                        // parser already captured some resources from what did arrive — keep those instead
                        // of wiping the list to empty.
                        setResources(incrementalResults);
                        setTruncated(incrementalTruncated);
                        if (resourceType) {
                            document.title = resourceType;
                        }
                    } else {
                        // noinspection JSCheckFunctionSignatures
                        setResources(json ? [json] : []);
                        if (json.id) {
                            document.title = `${json.id} (${resourceType})`;
                        } else {
                            document.title = 'FHIR Server';
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                    finishProgress();
                }
            }
        };
        callApi().catch(console.error);
        return () => {
            cancelled = true;
        };
    }, [
        id,
        queryString,
        resourceType,
        search,
        operation,
        vid,
        fhirUrl,
        setUserDetails,
        recordRequest,
        location.search,
        shouldBeJsonFormat,
        startProgress,
        onProgress,
        finishProgress,
    ]);

    if (operation === '$merge' && !shouldBeJsonFormat) {
        return <APIConsolePage />;
    }

    /**
     * Handle search event from child component
     * @param {SearchFormQuery} searchFormQuery
     */
    const handleSearch = (searchFormQuery: any) => {
        const identityProvider = getLocalData('identityProvider');
        if (!identityProvider) {
            throw new Error('Identity provider is not set');
        }
        const fhirApi = new FhirApi({
            fhirUrl,
            setUserDetails,
        });

        const newUrl: URL = fhirApi.getUrl({
            resourceType: resourceType,
            id: id,
            queryParameters: searchFormQuery.getQueryParameters(),
        });
        const relativePath = newUrl.pathname + newUrl.search + newUrl.hash;
        console.info(`Navigating to ${relativePath}`);
        navigate(relativePath);
        // setSearchClicked(true);
        // setSearchTabExpanded(false);
    };

    if (shouldBeJsonFormat) {
        return (
            <div style={{ width: '100%', padding: 0, margin: 0 }}>
                <div style={{ minHeight: '92vh' }}>
                    <Header />
                    {loading && <LinearProgress />}
                    <div style={{ padding: '0 10px' }}>
                        <PreJson data={resources} />
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Accordion expanded={searchTabExpanded} onChange={handleExpand}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls={'searchCollapse'}
                        id={'searchAccordion'}
                    >
                        <Typography variant="h5" sx={{ ml: 1 }}>
                            Search
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <SearchContainer
                            resourceType={resourceType}
                            onSearch={handleSearch}
                        ></SearchContainer>
                    </AccordionDetails>
                </Accordion>
                <div style={{ padding: '0 10px' }}>
                    <Box sx={{ my: 2 }}>{getBox()}</Box>
                </div>
            </div>
            <Footer requestId={bundle?.id} links={bundle?.link} />
        </div>
    );
};

export default IndexPage;
