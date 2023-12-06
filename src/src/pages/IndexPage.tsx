import React, { useContext, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Accordion, Alert, AlertTitle, Box, Container, LinearProgress } from '@mui/material';
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
import EnvironmentContext from '../EnvironmentContext';
import { TBundle } from '../types/resources/Bundle';

/**
 * IndexPage/home/ubuntu/Documents/code/EFS/fhir-server/src/src/pages/SearchPage.jsx
 * Note: Any route parameters are available via useParams()
 * @returns {Element}
 * @constructor
 */
const IndexPage = ({ search }: { search?: boolean }) => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const [resources, setResources] = useState<any>(undefined);
    const [bundle, setBundle] = useState<TBundle|undefined>(undefined);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [indexStart, setIndexStart] = useState(0);

    const { id, resourceType = '', operation } = useParams();

    const [searchTabExpanded, setSearchTabExpanded] = useState(false);
    const [resourceCardExpanded, setResourceCardExpanded] = useState(false);

    const navigate = useNavigate();

    const handleExpand = () => {
        setSearchTabExpanded(!searchTabExpanded);
    };

    const location = useLocation();
    const queryString = location.search;
    const shouldBeJsonFormat = ((new URLSearchParams(queryString || '').get('_format') || '').toLowerCase() === 'json');
    function getBox() {
        if (loading) {
            return <LinearProgress />;
        }
        if (parseInt(status) === 401) {
            return <Box>Login Expired</Box>;
        }
        if (parseInt(status) !== 200 && parseInt(status) !== 404) {
            return <Box>{status}</Box>;
        }
        if (resources && resources.length === 0) {
            return <Box>No Results Found</Box>;
        }
        // If narrative is returned then show it at top level
        return (
            <>
                {/* if we have a single resource*/}
                {resources && resources.length === 1 && resources[0].text?.div && (
                    <Alert severity="success">
                        <AlertTitle>Answer</AlertTitle>
                        <Box dangerouslySetInnerHTML={{ __html: resources[0].text?.div }} />
                    </Alert>
                )}
                {/*if we have a list of resources*/}
                {resources && resources.length === 1 && resources[0].resource?.text?.div && (
                    <Alert severity="success">
                        <AlertTitle>Answer</AlertTitle>
                        <Box
                            dangerouslySetInnerHTML={{
                                __html: resources[0].resource?.text?.div,
                            }}
                        />
                    </Alert>
                )}
                {resources.map((fullResource: any, index: number) => {
                    const resource = fullResource.resource || fullResource;
                    return (
                        <ResourceCard
                            key={index}
                            index={indexStart + index}
                            resource={resource}
                            expanded={resourceCardExpanded}
                        />
                    );
                })}
            </>
        );
    }

    console.log(
        `id: ${id}, resourceType: ${resourceType}, queryString: ${queryString},` +
            ` search: ${search}, operation: ${operation}`
    );

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
                    const fhirApi = new FhirApi({ fhirUrl });
                    const { json, status: statusCode } = await fhirApi.getBundleAsync({
                        resourceType,
                        id,
                        queryString,
                        operation,
                    });
                    if (statusCode === 401) {
                        window.location.reload();
                    }

                    // set indexStart
                    const queryParams = new URLSearchParams(location.search || '');
                    fhirApi.addMissingRequiredParams({ queryParams });
                    const pagesOffSet = parseInt(queryParams.get('_getpagesoffset') || '0');
                    const count = parseInt(queryParams.get('_count') || '0');
                    setIndexStart(pagesOffSet * count);

                    // noinspection JSCheckFunctionSignatures
                    setStatus(String(statusCode));
                    if (shouldBeJsonFormat) {
                        setResources(json);
                    } else if (json.entry) {
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
    }, [id, queryString, resourceType, search, operation]);

    /**
     * Handle search event from child component
     * @param {SearchFormQuery} searchFormQuery
     */
    const handleSearch = (searchFormQuery: any) => {
        const fhirApi = new FhirApi({ fhirUrl });

        /**
         * @type {URL}
         */
        const newUrl = fhirApi.getUrl({
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
        return <PreJson data={resources} />;
    }

    return (
        <Container maxWidth={false}>
            <Header fhirUrl={fhirUrl} />
            <Accordion expanded={searchTabExpanded} onChange={handleExpand}>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls={'searchCollapse'}
                    id={'searchAccordion'}
                >
                    <Typography variant="h5">Search</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <SearchContainer onSearch={handleSearch}></SearchContainer>
                </AccordionDetails>
            </Accordion>
            <Box my={2}>{getBox()}</Box>
            <Footer requestId={bundle?.id} links={bundle?.link} />
        </Container>
    );
};

export default IndexPage;
