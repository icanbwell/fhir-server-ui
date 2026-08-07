import React, { useEffect, useRef, useState } from 'react';
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
    // Determine this card's initial open state synchronously at mount via a lazy useState
    // initializer (runs exactly once, before any effect can race it) rather than defaulting to
    // `false` and correcting it in an effect afterward. This is what actually fixes cards
    // mounting/remounting (as they scroll in and out of the ResourceList virtualizer's window)
    // while expandAll is already true — there's no post-mount effect ordering for a second
    // effect to win.
    const [open, setOpen] = useState(() => {
        if (collapseAll) {
            return false;
        }
        if (expandAll) {
            return true;
        }
        return expanded;
    });

    const handleOpen = () => {
        setOpen(!open);
        setExpandAll(false);
        setCollapseAll(false);
    };

    // These only react to a flag turning ON, never to it turning back off. `handleOpen` (above)
    // "consumes" expandAll/collapseAll by resetting them to false whenever the user manually
    // toggles a single card — that reset is a global prop change shared by every mounted card,
    // so if this effect also resynced state on the falling edge (e.g. an `else` branch calling
    // setOpen(expanded)), it would silently re-collapse every other already-open card the moment
    // any one card was manually closed (and the mirror bug after Collapse All). Keeping each
    // effect a no-op on the falling edge preserves each card's independent `open` state once
    // it's been manually toggled, matching the pre-virtualization behavior.
    useEffect(() => {
        if (expandAll) {
            setOpen(true);
        }
    }, [expandAll]);

    useEffect(() => {
        if (collapseAll) {
            setOpen(false);
        }
    }, [collapseAll]);

    // Reacts to the `expanded` prop (IndexPage's `resourceCardExpanded`) changing on an
    // already-mounted card — e.g. navigating from a list view to a single-id view without a full
    // remount. Tracks the previous value in a ref (seeded once, at construction, to the
    // mount-time `expanded` value — matching what the useState initializer above already
    // accounted for) rather than a one-shot "have I run yet" boolean flag. A boolean flag
    // flipped inside the effect body would be corrupted by React 18 StrictMode's
    // development-only double-invocation of effects on mount (effect runs, cleanup runs (a
    // no-op here), effect runs again with the same ref value already mutated) — the flag would
    // read "not first" on that second, still-mount-related invocation, incorrectly forcing
    // setOpen(expanded) and undoing whatever the expandAll effect above had just set (verified
    // via a debug trace: on StrictMode's second invocation, `isFirst` was already `false`).
    // Comparing against the actual previous value instead is idempotent — re-invoking with the
    // same `expanded` value is always a no-op no matter how many times it happens, and only a
    // genuine change updates `open`.
    const prevExpandedRef = useRef(expanded);
    useEffect(() => {
        if (prevExpandedRef.current !== expanded) {
            prevExpandedRef.current = expanded;
            setOpen(expanded);
        }
    }, [expanded]);

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
