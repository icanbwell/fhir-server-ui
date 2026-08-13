import React, { useContext, useState, useEffect } from 'react';
import {
    Typography,
    Box,
    Alert,
    Card,
    CardContent,
    Link,
    List,
    ListItem,
    Paper,
    Divider,
    Tooltip,
} from '@mui/material';
import { alpha, useTheme as useMuiTheme } from '@mui/material/styles';
import DOMPurify from 'dompurify';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import LastRequestContext from '../context/LastRequestContext';
import BaseApi from '../api/baseApi';
import { useTheme } from '../context/ThemeContext';
import CodeIcon from '@mui/icons-material/Code';
import PaginatedTable from './PaginatedTable';
import './IPSNarrative.css'; // Import the CSS file for styling the IPS narrative
import PreJson from './PreJson';
import { getMandatorySectionContent } from '../constants/ipsConstants';
import { appendFormatJson } from '../utils/url.utils';
import { useStreamProgress } from '../hooks/useStreamProgress';
import StreamProgressIndicator from './StreamProgressIndicator';

interface IPSViewerProps {
    relativeUrl: string;
}

interface Resource {
    resourceType: string;
    id: string;

    [key: string]: any;
}

interface Bundle {
    resourceType: 'Bundle';
    type: string;
    entry: Array<{
        resource: Resource;
        [key: string]: any;
    }>;

    [key: string]: any;
}

export interface TableData {
    headers: string[];
    rows: string[][];
}

interface SectionData {
    id: string;
    title: string;
    tables: HTMLElement[];
    tablesData: TableData[];
    headings: HTMLElement[];
    content: string;
}


const IPSViewer: React.FC<IPSViewerProps> = ({ relativeUrl }) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [bundle, setBundle] = useState<Bundle | null>(null);
    const [rawResponse, setRawResponse] = useState<Object | null>(null);
    const [compositionHtml, setCompositionHtml] = useState<string>('');
    const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
    const [sectionData, setSectionData] = useState<SectionData[]>([]);
    const [collapsedResourceTypes, setCollapsedResourceTypes] = useState<Set<string>>(new Set());
    const [bundleResourcesCollapsed, setBundleResourcesCollapsed] = useState<boolean>(true);
    const [isIncomplete, setIsIncomplete] = useState<boolean>(false);
    const { progress, start, onProgress, finish } = useStreamProgress();
    const { isDarkMode } = useTheme();
    const theme = useMuiTheme();

    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const { recordRequest } = useContext(LastRequestContext);

    const baseApi = React.useMemo(
        () => new BaseApi({ fhirUrl, setUserDetails, onRequest: recordRequest }),
        [fhirUrl, setUserDetails, recordRequest]
    );

    const toggleSection = (sectionId: string) => {
        setCollapsedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    const toggleBundleResources = () => {
        setBundleResourcesCollapsed(prev => !prev);
    };

    const toggleResourceType = (resourceType: string) => {
        setCollapsedResourceTypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(resourceType)) {
                newSet.delete(resourceType);
            } else {
                newSet.add(resourceType);
            }
            return newSet;
        });
    };

    const resourcesByType = React.useMemo(() => {
        const grouped: { [key: string]: Resource[] } = {};
        if (bundle) {
            // Find the first Composition resource to skip it
            const compositionEntry = bundle.entry?.find(
                (entry) => entry.resource?.resourceType === 'Composition'
            );
            bundle.entry?.forEach((entry) => {
                if (entry.resource) {
                    const { resourceType, id } = entry.resource;
                    // Skip the first Composition resource in the bundle
                    if (
                        resourceType === 'Composition' &&
                        id === compositionEntry?.resource?.id
                    ) {
                        return;
                    }
                    if (!grouped[`${resourceType}`]) {
                        grouped[`${resourceType}`] = [];
                    }
                    grouped[`${resourceType}`].push(entry.resource);
                }
            });
        }
        return grouped;
    }, [bundle]);

    // Helper function to extract tables from HTML content
    const extractTablesFromHtml = (htmlContent: string): { tables: HTMLTableElement[], headings: HTMLElement[] } => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');

        // Find all tables, including those nested in divs
        const tables = Array.from(doc.querySelectorAll('table')) as HTMLTableElement[];
        const tableHeadings = Array.from(doc.querySelectorAll('h3')) as HTMLElement[];

        return { tables, headings: tableHeadings };
    };

    // Extract table data from HTML table element
    const extractTableData = (table: HTMLTableElement): TableData => {
        const headers: string[] = [];
        const rows: string[][] = [];

        // Extract headers - check for thead first, then first row
        let headerRow = table.querySelector('thead tr');
        if (!headerRow) {
            // Try to find a row with th elements
            headerRow = table.querySelector('tr:has(th)');
        }
        if (!headerRow) {
            // Fallback to first row if it seems to be a header
            const firstRow = table.querySelector('tr');
            if (firstRow) {
                const cells = firstRow.querySelectorAll('td, th');
                const hasThElements = firstRow.querySelectorAll('th').length > 0;
                if (hasThElements || cells.length <= 5) {
                    // Assume header if few columns or th elements
                    headerRow = firstRow;
                }
            }
        }

        if (headerRow) {
            const headerCells = headerRow.querySelectorAll('th, td');
            headerCells.forEach((cell) => {
                headers.push(cell.textContent?.trim() || '');
            });
        }

        // Extract data rows
        let dataRows: HTMLTableRowElement[] = Array.from(table.querySelectorAll('tbody tr'));
        if (dataRows.length === 0) {
            // No tbody, get all rows
            const allRows = Array.from(table.querySelectorAll('tr'));
            dataRows = allRows.filter((row) => row !== headerRow);
        }

        dataRows.forEach((row) => {
            const cells = row.querySelectorAll('td, th');
            const rowData: string[] = [];
            cells.forEach((cell) => {
                // Handle nested elements in cells
                let cellText = cell.textContent?.trim() || '';
                rowData.push(cellText);
            });
            if (rowData.some((cell) => cell.length > 0)) {
                // Only add rows with some content
                rows.push(rowData);
            }
        });

        return { headers, rows };
    };

    const shouldDisplaySection = (section: SectionData): boolean => {
        // If the section has tables with data, display it
        const hasTableRows = section.tablesData.some(table => table.rows.length > 0);

        if (hasTableRows) {
            return true;
        }

        // If the section is a mandatory IPS section, display it even if empty
        const mandatoryContent = getMandatorySectionContent(section.title);
        if (mandatoryContent) {
            return true;
        }

        // Otherwise, hide sections without tables and not mandatory
        return false;
    };

    useEffect(() => {
        const fetchBundle = async () => {
            setIsLoading(true);
            setErrorMessage(null);
            setIsIncomplete(false);
            start();

            try {
                const response = await baseApi.getData({ urlString: relativeUrl }, { onProgress });
                const bundleData: Bundle = response.json;
                setRawResponse(bundleData);
                setIsIncomplete(response.incomplete);

                // Extract the HTML content from the first Composition resource
                const compositionEntry = bundleData.entry?.find(
                    (entry) => entry.resource?.resourceType === 'Composition'
                );

                if (compositionEntry) {
                    const composition = compositionEntry.resource;
                    if (composition.text?.div) {
                        let baseHtml = '';

                        if (composition.title) {
                            baseHtml += '<h1>Patient Summary</h1>';
                        }
                        // Extract the div content from the composition
                        baseHtml += composition.text.div;

                        const sections = composition.section || [];
                        const sectionsData: SectionData[] = [];
                        const allSectionIds = new Set<string>();

                        sections.forEach((section: any, index: number) => {
                            if (section.text?.div) {
                                const sectionId = `section-${index}`;
                                allSectionIds.add(sectionId);

                                // Extract tables from the section content
                                const { tables, headings } = extractTablesFromHtml(section.text.div);
                                const tablesData: TableData[] = [];
                                if (tables && tables.length > 0) {
                                    tables.forEach((table) => {
                                        const tableData = extractTableData(table);
                                        tablesData.push(tableData);
                                    });
                                }
                                sectionsData.push({
                                    id: sectionId,
                                    title: section.title || `Section ${index + 1}`,
                                    tables,
                                    tablesData,
                                    headings,
                                    content: section.text.div
                                });
                            }
                        });

                        // Initialize all sections as collapsed
                        setCollapsedSections(allSectionIds);
                        setCompositionHtml(baseHtml);
                        setSectionData(sectionsData);
                        setBundle(bundleData);

                        // Initialize all resource types as collapsed
                        const resourceTypes = new Set<string>();
                        bundleData.entry?.forEach((entry) => {
                            if (entry.resource && entry.resource.resourceType !== 'Composition') {
                                resourceTypes.add(entry.resource.resourceType);
                            }
                        });
                        setCollapsedResourceTypes(resourceTypes);
                    } else {
                        setErrorMessage('No HTML content found in the Composition resource');
                    }
                } else {
                    setErrorMessage('No Composition resource found in the bundle');
                }
            } catch (error) {
                console.error('Error fetching IPS bundle:', error);
                setErrorMessage('Failed to load the International Patient Summary');
            } finally {
                setIsLoading(false);
                finish();
            }
        };

        fetchBundle();
    }, [relativeUrl, baseApi, start, onProgress, finish]);

    if (isLoading) {
        return (
            <Box sx={{ my: 4 }}>
                <StreamProgressIndicator progress={progress} />
            </Box>
        );
    }

    if (errorMessage) {
        return (
            <>
                <Alert severity="error">{errorMessage}</Alert>
                {rawResponse && <PreJson data={rawResponse} />}
            </>
        );
    }

    return (
        <Box sx={{ width: '100%', mb: 4 }}>
            {isIncomplete && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Connection interrupted — showing partial results.
                </Alert>
            )}
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 2,
                }}
            >
                <Typography variant="h5">International Patient Summary</Typography>
                <Tooltip title="View the raw JSON of this bundle" arrow placement="top">
                    <Link
                        href={appendFormatJson(relativeUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
                    >
                        <CodeIcon sx={{ mr: 0.5 }} />
                        View Raw Bundle
                    </Link>
                </Tooltip>
            </Box>

            {/* Render the HTML content from the Composition */}
            {compositionHtml && (
                <Paper
                    sx={{
                        p: 3,
                        mb: 4,
                        backgroundColor: isDarkMode ? theme.palette.background.paper : theme.palette.brand.lightGray,
                        color: theme.palette.text.primary,
                    }}
                    className={isDarkMode ? 'dark-mode' : ''}
                >
                    <Box
                        className="ips-narrative-container"
                        sx={{
                            '& a': {
                                color: isDarkMode ? theme.palette.brand.lilac : theme.palette.primary.main,
                            },
                            '--table-header-bg': isDarkMode ? alpha(theme.palette.common.white, 0.06) : theme.palette.brand.lightGray,
                            '--table-header-color': theme.palette.text.primary,
                            '--table-border-color': theme.palette.divider,
                            '--table-stripe-color': alpha(theme.palette.text.primary, 0.03),
                            '--text-color': theme.palette.text.primary,
                            '--heading-color': theme.palette.text.primary,
                            '--link-color': isDarkMode ? theme.palette.brand.lilac : theme.palette.primary.main,
                            '--section-border-color': theme.palette.divider,
                            '--highlight-bg': alpha(theme.palette.brand.yellow, isDarkMode ? 0.25 : 0.35),
                            '--code-bg': alpha(theme.palette.text.primary, 0.04),
                            '& .ips-section': {
                                backgroundColor: alpha(theme.palette.text.primary, 0.04),
                                padding: '0px 16px 5px',
                                marginBottom: '16px',
                                borderRadius: '4px',
                                border: `1px solid ${theme.palette.divider}`,
                            },
                            '& .ips-collapse-icon': {
                                transition: 'transform 0.2s ease',
                                cursor: 'pointer',
                            },
                            '& .ips-collapse-icon.collapsed': {
                                transform: 'rotate(-90deg)',
                            },
                            '& .ips-section-header': {
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px 0',
                            },
                        }}
                    >
                        {/* Render base composition content */}
                        <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(compositionHtml) }} />

                        {/* Render sections conditionally */}
                        {sectionData.map((section) => {

                            if (!shouldDisplaySection(section)) {
                                return null;
                            }

                            return (
                                <div key={section.id} className="ips-section">
                                    <div
                                        className="ips-section-header"
                                        onClick={() => toggleSection(section.id)}
                                    >
                                        <h2>{section.title}</h2>
                                        <span
                                            className={`ips-collapse-icon ${collapsedSections.has(section.id) ? 'collapsed' : ''}`}
                                        >
                                            ▼
                                        </span>
                                    </div>
                                    {!collapsedSections.has(section.id) && (
                                        <div className="ips-section-content">
                                            {/* Render extracted tables with pagination */}
                                            {section.tablesData.length > 0 && section.tablesData.map((table, tableIndex) => (
                                                <PaginatedTable
                                                    key={`${section.id}-table-${tableIndex}`}
                                                    tableData={table}
                                                    // eslint-disable-next-line security/detect-object-injection
                                                    title={section.headings[tableIndex]?.innerText}
                                                    sectionTitle={section.title}
                                                />
                                            ))}
                                            {
                                                section.tables.length === 0 &&
                                                <div
                                                    className="ips-section-content"
                                                    dangerouslySetInnerHTML={{
                                                        __html: DOMPurify.sanitize(
                                                            getMandatorySectionContent(section.title) || section.content
                                                        )
                                                    }}
                                                />
                                            }
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </Box>
                </Paper>
            )}

            {/* List all resources in the bundle */}
            {Object.keys(resourcesByType).length > 0 && (
                <Box sx={{ mt: 4, mb: 2 }}>
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            '&:hover': {
                                backgroundColor: theme.palette.action.hover,
                            },
                            p: 1,
                            borderRadius: 1,
                        }}
                        onClick={toggleBundleResources}
                    >
                        <Typography variant="h6">
                            Bundle Resources ({Object.values(resourcesByType).reduce((sum, resources) => sum + resources.length, 0)})
                        </Typography>
                        <span
                            className={`ips-collapse-icon ${bundleResourcesCollapsed ? 'collapsed' : ''}`}
                            style={{
                                transition: 'transform 0.2s ease',
                                transform: bundleResourcesCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                            }}
                        >
                            ▼
                        </span>
                    </Box>
                </Box>)}

            {!bundleResourcesCollapsed && Object.keys(resourcesByType).map((resourceType) => (
                <Card key={resourceType} sx={{ mb: 2 }}>
                    <CardContent>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: theme.palette.action.hover,
                                },
                                p: 1,
                                borderRadius: 1,
                                mb: collapsedResourceTypes.has(resourceType) ? 0 : 2,
                            }}
                            onClick={() => toggleResourceType(resourceType)}
                        >
                            <Typography variant="h6">
                                {resourceType} ({resourcesByType[`${resourceType}`].length})
                            </Typography>
                            <span
                                className={`ips-collapse-icon ${collapsedResourceTypes.has(resourceType) ? 'collapsed' : ''}`}
                                style={{
                                    transition: 'transform 0.2s ease',
                                    transform: collapsedResourceTypes.has(resourceType) ? 'rotate(-90deg)' : 'rotate(0deg)',
                                }}
                            >
                                ▼
                            </span>
                        </Box>
                        {!collapsedResourceTypes.has(resourceType) && (
                            <>
                                <Divider sx={{ mb: 2 }} />
                                <List dense>
                                    {resourcesByType[`${resourceType}`].map((resource) => (
                                        <ListItem key={resource.id}>
                                            <Link
                                                href={`/4_0_0/${resourceType}/${resource.id}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                            >
                                                {resource.id}
                                            </Link>
                                        </ListItem>
                                    ))}
                                </List>
                            </>
                        )}
                    </CardContent>
                </Card>
            ))}
        </Box>
    );
};

export default IPSViewer;
