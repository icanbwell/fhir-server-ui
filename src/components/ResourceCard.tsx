import React, { useEffect, useState } from 'react';
import { Box, Button, Card, CardContent, CardHeader, Collapse, Tooltip } from '@mui/material';
import ResourceItem from './ResourceItem';
import Json from './Json';
import { TResource } from '../types/resources/Resource';
import { Link } from 'react-router-dom';
import Typography from '@mui/material/Typography';
import GridOnIcon from '@mui/icons-material/GridOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DescriptionIcon from '@mui/icons-material/Description';
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

    useEffect(() => {
        if (expandAll) {
            setOpen(true);
        }
        if (collapseAll) {
            setOpen(false);
        }
    }, [expandAll, collapseAll]);

    useEffect(() => {
        setOpen(expanded);
    }, [expanded]);

    // List of resource types that should show FileDownload
    const spreadSheetResourceTypes = ['Patient', 'Person', 'Practitioner'];
    const summaryResourceTypes = ['Patient', 'Person'];

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
                        {resource.resourceType &&
                            summaryResourceTypes.includes(resource.resourceType.toString()) &&
                            getIPSLink({ resource, uuid: uuid?.toString() })}
                        <Button>{open ? 'Close' : 'Open'}</Button>
                    </Box>
                }
            ></CardHeader>
            <Collapse in={open}>
                <CardContent>
                    <ResourceItem resourceType={resource.resourceType} resource={resource} />
                    <Box sx={{ borderBottom: '1px solid #ccc', my: 2 }} />
                    {/* Render JSON component */}
                    <Json resource={resource} error={error} />
                    {/* Conditionally render FileDownload based on resource type */}
                    {resource.resourceType &&
                        spreadSheetResourceTypes.includes(resource.resourceType.toString()) && (
                            <Box
                                sx={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                    mt: 2,
                                }}
                            >
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

                                {summaryResourceTypes.includes(
                                    resource.resourceType.toString()
                                ) && <Box>{getIPSLink({ resource, uuid: uuid?.toString() })}</Box>}
                            </Box>
                        )}
                </CardContent>
            </Collapse>
        </Card>
    );
};

export default ResourceCard;
