import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CardHeader, Collapse, IconButton, Tooltip } from '@mui/material';
import ResourceItem from './ResourceItem';
import Json from './Json';
import { TResource } from '../types/resources/Resource';
import { Link } from 'react-router';
import Typography from '@mui/material/Typography';
import GridOnIcon from '@mui/icons-material/GridOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DescriptionIcon from '@mui/icons-material/Description';
import EditIcon from '@mui/icons-material/Edit';
import { IdentifierSystem } from '../utils/identifierSystem';

type TResourceCardProps = {
    index: number;
    resource: TResource;
    expanded: boolean;
    expandAll: boolean;
    collapseAll: boolean;
    setExpandAll: React.Dispatch<React.SetStateAction<boolean>>;
    setCollapseAll: React.Dispatch<React.SetStateAction<boolean>>;
    error?: boolean;
};

type TGetIPSLinkProps = {
    resource: TResource;
    uuid?: string;
};

const getIPSLink = ({
    resource,
    uuid,
}: TGetIPSLinkProps) => {
    return (
        <Tooltip title="View International Patient Summary">
            <Link
                to={`/ips/4_0_0/Patient/${resource.resourceType === 'Person' ? 'person.' : ''}${uuid}/$summary?_includeSummaryCompositionOnly=true`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    textDecoration: 'none',
                    color: 'inherit',
                }}
            >
                <DescriptionIcon color="primary" fontSize="small" />
                <Typography variant="body2" color="primary">
                    IPS
                </Typography>
                <OpenInNewIcon color="primary" fontSize="small" />
            </Link>
        </Tooltip>
    );
};

const getCompositionSummaryLink = ({ uuid }: { uuid?: string }) => {
    return (
        <Tooltip title="View Composition Summary">
            <Link
                to={`/composition-summary/4_0_0/Composition/${uuid}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e: React.MouseEvent) => e.stopPropagation()}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    textDecoration: 'none',
                    color: 'inherit',
                }}
            >
                <DescriptionIcon color="primary" fontSize="small" />
                <Typography variant="body2" color="primary">
                    Composition View
                </Typography>
                <OpenInNewIcon color="primary" fontSize="small" />
            </Link>
        </Tooltip>
    );
};

const ResourceCard = ({
    index,
    resource,
    expanded,
    error,
    expandAll,
    collapseAll,
    setExpandAll,
    setCollapseAll,
}: TResourceCardProps) => {
    const [open, setOpen] = useState(false);

    const handleOpen = () => {
        setOpen(!open);
        setExpandAll(false);
        setCollapseAll(false);
    };

    // A single effect computing `open` from all three inputs in one pass, with clear
    // precedence (collapseAll wins, then expandAll, then the initial `expanded` prop).
    // This runs on every mount as well as on dependency changes — with virtualized lists
    // (ResourceList), cards mount/unmount as they scroll in and out of view, so a card that
    // remounts while `expandAll` is still true must come back open. Splitting this into two
    // separate effects (one keyed on [expandAll, collapseAll], one keyed on [expanded]) let
    // the second effect's `setOpen(expanded)` unconditionally clobber the first effect's
    // `setOpen(true)` on every fresh mount, since both effects always run on mount regardless
    // of their dependency arrays — collapsing this into one effect with one setOpen call
    // removes that race entirely.
    useEffect(() => {
        if (collapseAll) {
            setOpen(false);
        } else if (expandAll) {
            setOpen(true);
        } else {
            setOpen(expanded);
        }
    }, [expandAll, collapseAll, expanded]);

    // List of resource types that should show FileDownload
    const spreadSheetResourceTypes = ['Patient', 'Person', 'Practitioner'];
    const summaryResourceTypes = ['Patient', 'Person'];
    const compositionSummaryResourceTypes = ['Composition'];

    const tagUUID = resource?.meta?.tag?.find((s) => s.system === IdentifierSystem.uuid)?.code;
    const uuid = tagUUID ? tagUUID : resource.id;

    return (
        <Card key={index}>
            <CardHeader
                onClick={handleOpen}
                style={{ cursor: 'pointer' }}
                title={`(${index + 1}) ${resource.resourceType}/${uuid ?? ''}`}
                action={
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {resource.id && (
                            <Tooltip title="Edit Resource">
                                <IconButton
                                    component={Link}
                                    to={`/4_0_0/${resource.resourceType}/${uuid}/$merge`}
                                    onClick={(e: React.MouseEvent) => e.stopPropagation()}
                                    size="small"
                                    color="primary"
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        {resource.resourceType &&
                            summaryResourceTypes.includes(resource.resourceType.toString()) &&
                            getIPSLink({ resource, uuid: uuid?.toString() })}
                        {resource.resourceType &&
                            compositionSummaryResourceTypes.includes(resource.resourceType.toString()) &&
                            getCompositionSummaryLink({ uuid: uuid?.toString() })}
                        <Button>{open ? 'Close' : 'Open'}</Button>
                    </Box>
                }
            ></CardHeader>
            <Collapse in={open} mountOnEnter unmountOnExit>
                <CardContent>
                    <ResourceItem resourceType={resource.resourceType} resource={resource} />
                    <Box sx={{ borderBottom: '1px solid #ccc', my: 2 }} />
                    {/* Render JSON component */}
                    <Json resource={resource} error={error} />
                    {/* Conditionally render FileDownload based on resource type */}
                    {resource.resourceType &&
                        (spreadSheetResourceTypes.includes(resource.resourceType.toString()) ||
                            compositionSummaryResourceTypes.includes(resource.resourceType.toString())) && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    mt: 2,
                                }}
                            >
                                {spreadSheetResourceTypes.includes(resource.resourceType.toString()) && (
                                    <Box>
                                        <Tooltip title="Open Summary in New Spreadsheet Tab">
                                            {/* The resource type is included twice in the URL to meet API requirements:
                                                - The first occurrence specifies the resource type and ID for the main resource.
                                                - The second occurrence in `$everything/{resourceType}` specifies the summary type. */}
                                            <Link
                                                to={`/excel/4_0_0/${resource.resourceType}/${resource.id}/$everything/${resource.resourceType}`}
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
                                                    Open as Spreadsheet
                                                </Typography>
                                                <OpenInNewIcon color="primary" />
                                            </Link>
                                        </Tooltip>
                                    </Box>
                                )}

                                {summaryResourceTypes.includes(
                                    resource.resourceType.toString()
                                ) && <Box>{getIPSLink({ resource, uuid: uuid?.toString() })}</Box>}

                                {compositionSummaryResourceTypes.includes(resource.resourceType.toString()) && (
                                    <Box>{getCompositionSummaryLink({ uuid: uuid?.toString() })}</Box>
                                )}
                            </Box>
                        )}
                </CardContent>
            </Collapse>
        </Card>
    );
};

export default ResourceCard;
