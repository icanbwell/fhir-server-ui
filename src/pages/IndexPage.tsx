import { useContext, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Accordion, Alert, AlertTitle, Box, Button, LinearProgress, Tooltip } from '@mui/material';
import DOMPurify from 'dompurify';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Typography from '@mui/material/Typography';
import ResourceCard from '../components/ResourceCard';
import FhirApi from '../api/fhirApi';
import SearchContainer from '../components/SearchContainer';
import PreJson from '../components/PreJson';
import EnvironmentContext from '../context/EnvironmentContext';
import { TBundle } from '../types/resources/Bundle';
import UserContext from '../context/UserContext';
import GridOnIcon from '@mui/icons-material/GridOn'; // New icon for spreadsheet
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { getLocalData } from '../utils/localData.utils';
import FilterSummary from '../components/FilterSummary';

/**
 * IndexPage/home/ubuntu/Documents/code/EFS/fhir-server/src/pages/SearchPage.jsx
 * Note: Any route parameters are available via useParams()
 */
const IndexPage = ({ search }: { search?: boolean }) => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const [resources, setResources] = useState<any>();
    const [bundle, setBundle] = useState<TBundle | undefined>();
    const [status, setStatus] = useState<number | undefined>();
    const [loading, setLoading] = useState(false);
    const [indexStart, setIndexStart] = useState(0);

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
        if (loading) {
            return <LinearProgress />;
        }
        if (status === 401) {
            return <Box>Login Expired</Box>;
        }
        if (resources && resources.length === 0) {
            return <Box>No Results Found</Box>;
        }
        // If narrative is returned then show it at top level
        return (
            <>
                {resources?.length > 1 && (
                    <Box display="flex" justifyContent="end">
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
                {resources && resources.length === 1 && resources[0].text?.div && (
                    <Alert severity="success">
                        <AlertTitle>Answer</AlertTitle>
                        <Box dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resources[0].text?.div) }} />
                    </Alert>
                )}
                {/*if we have a list of resources*/}
                {resources && resources.length === 1 && resources[0].resource?.text?.div && (
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

                {resources?.map((fullResource: any, index: number) => {
                    const resource = fullResource.resource || fullResource;
                    const error = resource.resourceType === 'OperationOutcome';
                    return (
                        <ResourceCard
                            key={index}
                            index={indexStart + index}
                            resource={resource}
                            expanded={resourceCardExpanded}
                            expandAll={expandAll}
                            collapseAll={collapseAll}
                            setExpandAll={setExpandAll}
                            setCollapseAll={setCollapseAll}
                            error={error}
                        />
                    );
                })}
            </>
        );
    }

    useEffect(() => {
        if (id) {
            setResourceCardExpanded(true);
        }
        const callApi = async () => {
            document.title = 'Helix FHIR Server';
            if (search) {
                setSearchTabExpanded(true);
                return;
            }
            try {
                setLoading(true);
                if (fhirUrl) {
                    const identityProvider = getLocalData('identityProvider');
                    if (!identityProvider) {
                        // noinspection ExceptionCaughtLocallyJS
                        throw new Error('Identity provider is not set');
                    }
                    const fhirApi = new FhirApi({
                        fhirUrl,
                        setUserDetails,
                    });
                    const { json, status: statusCode } = await fhirApi.getBundleAsync({
                        resourceType,
                        id,
                        queryString,
                        operation: vid ? `_history/${vid}` : operation,
                    });

                    // set indexStart
                    const queryParams = new URLSearchParams(location.search || '');
                    fhirApi.addMissingRequiredParams({ queryParams, resourceType });
                    const pagesOffSet = parseInt(queryParams.get('_getpagesoffset') || '0');
                    const count = parseInt(queryParams.get('_count') || '0');
                    setIndexStart(pagesOffSet * count);

                    // noinspection JSCheckFunctionSignatures
                    setStatus(statusCode);
                    if (shouldBeJsonFormat) {
                        setResources(json);
                    } else if (json && json.entry) {
                        setResources(json.entry);
                        setBundle(json);
                        if (resourceType) {
                            document.title = resourceType;
                        }
                    } else {
                        // noinspection JSCheckFunctionSignatures
                        setResources(json ? [json] : []);
                        if (json.id) {
                            document.title = `${json.id} (${resourceType})`;
                        } else {
                            document.title = 'Helix FHIR Server';
                        }
                    }
                }
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        callApi().catch(console.error);
    }, [
        id,
        queryString,
        resourceType,
        search,
        operation,
        vid,
        fhirUrl,
        setUserDetails,
        location.search,
        shouldBeJsonFormat,
    ]);

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
                    <FilterSummary queryString={queryString} resourceType={resourceType} />
                    <Box my={2}>{getBox()}</Box>
                </div>
            </div>
            <Footer requestId={bundle?.id} links={bundle?.link} />
        </div>
    );
};

export default IndexPage;
