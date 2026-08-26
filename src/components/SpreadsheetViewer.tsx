import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { read, utils, type WorkBook } from 'xlsx';
import {
    Typography,
    Box,
    Alert,
    Tabs,
    Tab,
    FormControlLabel,
    Checkbox,
    Button,
} from '@mui/material';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import BaseApi from '../api/baseApi';
import { useStreamProgress } from '../hooks/useStreamProgress';
import { useAgGridBrandTheme } from '../hooks/useAgGridBrandTheme';
import StreamProgressIndicator from './StreamProgressIndicator';
import {
    ModuleRegistry,
    ColumnAutoSizeModule,
    ColumnHoverModule,
    RowAutoHeightModule,
    RowStyleModule,
    TooltipModule,
    TextFilterModule,
    NumberFilterModule,
    DateFilterModule,
    QuickFilterModule,
    ClientSideRowModelModule,
} from 'ag-grid-community';
import FileDownload from './FileDownload';
import type { ICellRendererParams } from 'ag-grid-community';
import { useNavigate, useLocation } from 'react-router';
import { useTheme } from '../context/ThemeContext';
import { buildSheetColumnsAndRows } from '../utils/spreadsheetColumns';

ModuleRegistry.registerModules([
    ColumnAutoSizeModule,
    ColumnHoverModule,
    RowAutoHeightModule,
    RowStyleModule,
    TooltipModule,
    TextFilterModule,
    NumberFilterModule,
    DateFilterModule,
    QuickFilterModule,
    ClientSideRowModelModule,
]);

interface SpreadsheetViewerProps {
    relativeUrl: string;
    format:
        | 'text/csv'
        | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        | 'application/vnd.ms-excel';
}

interface SheetData {
    id: number; // Add id property
    name: string;
    columnDefs: any[];
    rowData: any[];
}

const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({ relativeUrl, format }) => {
    const tabsRef = useRef<HTMLDivElement>(null);
    const gridApiRef = useRef<any>(null); // Ref to store the grid API

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [sheets, setSheets] = useState<SheetData[]>([]);
    const [activeSheetName, setActiveSheetName] = useState<string>();
    const [hideEmptyColumns, setHideEmptyColumns] = useState<boolean>(true);

    // The FHIR server's own default page size is much smaller (observed: 100 rows) when a
    // request doesn't specify `_count` — bump the default so most exports need no follow-up,
    // while still capping how far "Load more" can go so a single click can't request an
    // unbounded export.
    const DEFAULT_SPREADSHEET_COUNT = 1000;
    const MAX_SPREADSHEET_COUNT = 20000;

    const navigate = useNavigate(); // Initialize navigate
    const location = useLocation(); // Initialize location

    const countFromUrl = (search: string): number => {
        const existingCount = parseInt(new URLSearchParams(search).get('_count') || '', 10);
        return !isNaN(existingCount) && existingCount > 0 ? existingCount : DEFAULT_SPREADSHEET_COUNT;
    };

    // Initialized lazily from the URL (rather than always DEFAULT_SPREADSHEET_COUNT, synced
    // afterwards by the effect below) so a URL that already carries an explicit _count doesn't
    // trigger a first fetch with the wrong count before the sync effect runs.
    const [requestedCount, setRequestedCount] = useState<number>(() => countFromUrl(location.search));
    const [truncatedSheetNames, setTruncatedSheetNames] = useState<Set<string>>(new Set());

    const { isDarkMode } = useTheme(); // Get dark mode state

    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);

    const { progress, start, onProgress, finish } = useStreamProgress();

    const baseApi = React.useMemo(
        () => new BaseApi({ fhirUrl, setUserDetails }),
        [fhirUrl, setUserDetails]
    );

    const sortedSheets = useMemo(() => {
        return [...sheets].sort((a, b) => a.name.localeCompare(b.name));
    }, [sheets]);

    const gridTheme = useAgGridBrandTheme(isDarkMode);

    const downloadUri = useMemo(() => {
        const uri = new URL(relativeUrl, fhirUrl);
        uri.searchParams.set('_format', format);
        const queryString = new URLSearchParams(location.search);
        for (const [key, value] of queryString.entries()) {
            if (key !== '_format' && key !== '_count') {
                uri.searchParams.set(key, value);
            }
        }
        uri.searchParams.set('_count', String(requestedCount));
        return uri;
    }, [relativeUrl, fhirUrl, format, location.search, requestedCount]);

    useEffect(() => {
        setRequestedCount(countFromUrl(location.search));
        // Also keyed on relativeUrl (not just location.search) so navigating to a different
        // resource without an explicit _count in the URL resets a "Load more"-bumped count back
        // to the default, instead of leaking an elevated count into the new resource's view.
    }, [location.search, relativeUrl]);

    useEffect(() => {
        const fetchSpreadsheetData = async () => {
            try {
                setIsLoading(true);
                setErrorMessage(null);
                start();

                const response = await baseApi.downloadFile(downloadUri.toString(), { onProgress });

                if (response.status !== 200) {
                    throw new Error(`HTTP ${response.status}: Failed to fetch spreadsheet`);
                }

                const arrayBuffer = await response.data.arrayBuffer();

                let workbook: WorkBook;
                if (format === 'text/csv') {
                    workbook = read(arrayBuffer, { type: 'buffer', codepage: 65001 });
                } else {
                    workbook = read(arrayBuffer, { type: 'buffer' });
                }

                const parsedSheets: SheetData[] = workbook.SheetNames.map(
                    (sheetName, sheetIndex) => {
                        const worksheet = workbook.Sheets[`${sheetName}`];
                        const rawData: any[][] = utils.sheet_to_json(worksheet, {
                            header: 1,
                            raw: true,
                            rawNumbers: true,
                            UTC: true,
                        });

                        const [headers, ...dataRows] = rawData;

                        const { columnDefs, rowData } = buildSheetColumnsAndRows(
                            headers,
                            dataRows,
                            hideEmptyColumns
                        );

                        // Add a new column for the FHIR resource link
                        // noinspection JSUnusedGlobalSymbols
                        columnDefs.push({
                            headerName: 'FHIR Link',
                            field: 'fhirLink',
                            cellRenderer: (params: ICellRendererParams) => {
                                const resourceUrl = `/4_0_0/${sheetName}/${params.data.col0}`; // Assuming `col0` contains the resource ID
                                return (
                                    <a href={resourceUrl} target="_blank" rel="noopener noreferrer">
                                        {sheetName}/{params.data.col0}
                                    </a>
                                );
                            },
                            editable: false,
                            filter: false,
                        });

                        return {
                            id: sheetIndex,
                            name: sheetName,
                            columnDefs,
                            rowData,
                        };
                    }
                );

                setSheets(parsedSheets);
                setTruncatedSheetNames(
                    new Set(parsedSheets.filter((s) => s.rowData.length >= requestedCount).map((s) => s.name))
                );
                setIsLoading(false);
                finish();
            } catch (error) {
                setErrorMessage(`Failed to load spreadsheet: ${(error as Error).message}`);
                setIsLoading(false);
                finish();
            }
        };

        fetchSpreadsheetData().then((r) => r);
    }, [
        relativeUrl,
        hideEmptyColumns,
        downloadUri,
        requestedCount,
        format,
        baseApi,
        start,
        onProgress,
        finish,
    ]);

    const defaultColDef = useMemo(
        () => ({
            resizable: true,
            sortable: true,
            filter: true,
        }),
        []
    );

    const handleTabChange = (event: React.SyntheticEvent, newValue: string) => {
        if (newValue === undefined) {
            return;
        }
        setActiveSheetName(newValue);

        let currentPath = location.pathname;
        if (currentPath.endsWith('$everything')) {
            // Append the tab name if $everything is at the end
            currentPath = `${currentPath}/${newValue}`;
        } else {
            // Replace the last segment with the tab name
            currentPath = currentPath.split('/').slice(0, -1).join('/') + `/${newValue}`;
        }

        navigate(currentPath, { replace: true });

        // Clear filters when switching tabs
        if (gridApiRef.current) {
            gridApiRef.current.setFilterModel(null);
        }
    };

    useEffect(() => {
        // Extract the tab name from the path
        const pathTabName = location.pathname.includes('$everything')
            ? location.pathname.split('$everything/')[1]?.split('/')[0]
            : undefined;

        if (pathTabName !== undefined) {
            setActiveSheetName(pathTabName);
        } else if (sortedSheets.length > 0) {
            setActiveSheetName(sortedSheets[0].name);
        }
    }, [location.pathname, sortedSheets]);

    const onGridReady = (params: any) => {
        gridApiRef.current = params.api; // Store the grid API
    };

    if (isLoading) {
        return (
            <Box
                sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}
            >
                <StreamProgressIndicator progress={progress} />
                <Typography variant="body2" sx={{ mt: 2 }}>
                    Loading spreadsheet...
                </Typography>
            </Box>
        );
    }

    if (errorMessage) {
        return (
            <Alert severity="error" sx={{ width: '100%' }}>
                {errorMessage}
            </Alert>
        );
    }

    return (
        <Box
            sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: 1,
                    borderColor: 'divider',
                    mb: 2,
                    height: '30px',
                }}
            >
                <Tabs
                    ref={tabsRef}
                    value={activeSheetName || ''}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{
                        flexGrow: 1,
                    }}
                >
                    {sortedSheets.map((sheet: SheetData) => (
                        <Tab
                            key={sheet.name}
                            label={`${sheet.name} (${sheet.rowData.length})`}
                            value={sheet.name}
                            sx={{
                                textTransform: 'none',
                                minWidth: 'auto',
                                padding: '6px 12px',
                            }}
                        />
                    ))}
                </Tabs>
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={hideEmptyColumns}
                            onChange={(e) => setHideEmptyColumns(e.target.checked)}
                            size="small"
                        />
                    }
                    label={<Typography variant="caption">Hide Empty Columns</Typography>}
                    sx={{ mr: 1 }}
                />
                <FileDownload relativeUrl={relativeUrl} format="application/vnd.ms-excel" />
            </Box>
            <Box
                sx={{
                    flexGrow: 1,
                    width: '100%',
                }}
            >
                {activeSheetName && truncatedSheetNames.has(activeSheetName) && (
                    <Alert
                        severity="warning"
                        sx={{ mb: 1 }}
                        action={
                            requestedCount < MAX_SPREADSHEET_COUNT ? (
                                <Button
                                    color="inherit"
                                    size="small"
                                    onClick={() =>
                                        setRequestedCount((count) => Math.min(count * 2, MAX_SPREADSHEET_COUNT))
                                    }
                                >
                                    Load more
                                </Button>
                            ) : undefined
                        }
                    >
                        Showing the first {requestedCount.toLocaleString()} rows for this sheet
                        {requestedCount >= MAX_SPREADSHEET_COUNT
                            ? ` (maximum). Narrow your query to see the rest.`
                            : '.'}
                    </Alert>
                )}
                <AgGridReact
                    theme={gridTheme}
                    columnDefs={sortedSheets.find((s) => s.name === activeSheetName)?.columnDefs || []}
                    rowData={sortedSheets.find((s) => s.name === activeSheetName)?.rowData || []}
                    defaultColDef={defaultColDef}
                    onGridReady={onGridReady}
                    gridOptions={{
                        enableCellTextSelection: true,
                        enableBrowserTooltips: true, // Enable browser tooltips
                    }}
                />
            </Box>
        </Box>
    );
};

export default SpreadsheetViewer;
