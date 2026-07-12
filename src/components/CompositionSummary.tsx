import React from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Link,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CodeIcon from '@mui/icons-material/Code';
import { TComposition } from '../types/resources/Composition';
import { TCompositionSection } from '../types/partials/CompositionSection';
import { TCoding } from '../types/partials/Coding';
import { TReference } from '../types/partials/Reference';

type TCompositionSummaryProps = {
    resource: TComposition;
    rawJsonHref?: string;
};

const parseReference = (reference?: String): { resourceType: string; id: string } | null => {
    if (!reference) {
        return null;
    }
    const parts = String(reference).split('/');
    if (parts.length < 2) {
        return null;
    }
    return { resourceType: parts[0], id: parts.slice(1).join('/') };
};

const ReferenceLink = ({ reference }: { reference?: TReference }) => {
    const parsed = parseReference(reference?.reference);
    const label = reference?.display || reference?.reference;
    if (!parsed || !label) {
        return <Typography component="span">{label || 'Not specified'}</Typography>;
    }
    return (
        <Link
            href={`/4_0_0/${parsed.resourceType}/${parsed.id}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
            {label}
            <OpenInNewIcon fontSize="inherit" />
        </Link>
    );
};

// Picks the coding flagged "preferred" (b.well's convention for multi-system codings),
// falling back to the first coding, then to plain text.
const preferredCoding = (coding?: TCoding[]): TCoding | undefined => {
    if (!coding || coding.length === 0) {
        return undefined;
    }
    const preferred = coding.find((c) =>
        c.extension?.some((e) => e.id === 'preferred' || e.valueCode === 'preferred')
    );
    return preferred || coding[0];
};

const EntryChips = ({ entries }: { entries?: TReference[] }) => {
    if (!entries || entries.length === 0) {
        return null;
    }
    return (
        <Box sx={{ mt: 1 }}>
            <Typography variant="caption" color="text.secondary">
                Linked Entries ({entries.length})
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {entries.map((entry, index) => {
                    const parsed = parseReference(entry.reference);
                    if (!parsed) {
                        return null;
                    }
                    return (
                        <Chip
                            key={index}
                            size="small"
                            variant="outlined"
                            component="a"
                            href={`/4_0_0/${parsed.resourceType}/${parsed.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            clickable
                            icon={<OpenInNewIcon fontSize="inherit" />}
                            label={entry.display || `${parsed.resourceType}/${parsed.id}`}
                        />
                    );
                })}
            </Box>
        </Box>
    );
};

// A composition's section[] narrative is a sequence of {title, text.div} rows keyed by
// title (not fixed field names — see the b.well composition reference doc), interleaved
// with deeper section[] groups for financial/coverage domains (EOB, Member, Payer-Member).
// This renders runs of leaf rows as a Field | Value table and recurses into nested groups.
const SectionGroup = ({ sections }: { sections?: TCompositionSection[] }) => {
    if (!sections || sections.length === 0) {
        return null;
    }

    const blocks: React.ReactElement[] = [];
    let leafRun: TCompositionSection[] = [];

    const flushLeafRun = (key: string) => {
        if (leafRun.length === 0) {
            return;
        }
        blocks.push(
            <TableContainer key={key} component={Paper} variant="outlined" sx={{ mb: 1 }}>
                <Table size="small">
                    <TableBody>
                        {leafRun.map((row, index) => (
                            <TableRow key={index}>
                                <TableCell sx={{ fontWeight: 600, width: '35%' }}>
                                    {row.title}
                                </TableCell>
                                <TableCell>{row.text?.div || '—'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        );
        leafRun = [];
    };

    sections.forEach((section, index) => {
        const isLeaf = !section.section || section.section.length === 0;
        if (isLeaf) {
            leafRun.push(section);
            return;
        }
        flushLeafRun(`leaves-${index}`);
        blocks.push(
            <Accordion key={`group-${index}`} disableGutters sx={{ ml: 2, mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2">{section.title || 'Section'}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <SectionGroup sections={section.section} />
                </AccordionDetails>
            </Accordion>
        );
    });
    flushLeafRun('leaves-end');

    return <>{blocks}</>;
};

const CompositionSummary = ({ resource, rawJsonHref }: TCompositionSummaryProps) => {
    const sectionCount = resource.section?.length || 0;
    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                    <Typography variant="h5">{resource.title || 'Composition'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {sectionCount} section{sectionCount === 1 ? '' : 's'}
                    </Typography>
                </Box>
                {rawJsonHref && (
                    <Tooltip title="View the raw JSON of this resource" arrow placement="top">
                        <Link
                            href={rawJsonHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, textDecoration: 'none' }}
                        >
                            <CodeIcon fontSize="small" />
                            View Raw JSON
                        </Link>
                    </Tooltip>
                )}
            </Box>

            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {resource.status && <Chip label={String(resource.status)} color="primary" size="small" />}
                        {resource.type?.coding?.map((c, i) => (
                            <Chip key={i} size="small" variant="outlined" label={c.display || c.code} />
                        ))}
                    </Box>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableBody>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, width: '20%' }}>Identifier</TableCell>
                                    <TableCell>{resource.identifier?.value || '—'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Subject</TableCell>
                                    <TableCell>
                                        <ReferenceLink reference={resource.subject} />
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                                    <TableCell>{resource.date ? String(resource.date) : '—'}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600 }}>Author</TableCell>
                                    <TableCell>
                                        {resource.author && resource.author.length > 0 ? (
                                            resource.author.map((a, i) => (
                                                <Box key={i}>
                                                    <ReferenceLink reference={a} />
                                                </Box>
                                            ))
                                        ) : (
                                            '—'
                                        )}
                                    </TableCell>
                                </TableRow>
                                {resource.custodian && (
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Custodian</TableCell>
                                        <TableCell>
                                            <ReferenceLink reference={resource.custodian} />
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            {(resource.section || []).map((section, index) => {
                const coding = preferredCoding(section.code?.coding);
                const codingLabel = coding?.display || coding?.code;
                const title = section.title || `Section ${index + 1}`;
                const showCodingChip =
                    codingLabel && codingLabel.trim().toLowerCase() !== title.trim().toLowerCase();
                return (
                    <Accordion key={section.id ? String(section.id) : index} sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    width: '100%',
                                    mr: 1,
                                }}
                            >
                                <Typography variant="h6">{title}</Typography>
                                {showCodingChip && (
                                    <Chip size="small" label={codingLabel} variant="outlined" />
                                )}
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <EntryChips entries={section.entry} />
                            <Divider sx={{ my: 1.5 }} />
                            <SectionGroup sections={section.section} />
                        </AccordionDetails>
                    </Accordion>
                );
            })}
        </Box>
    );
};

export default CompositionSummary;
