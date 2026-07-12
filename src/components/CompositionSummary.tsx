import React, { useState } from 'react';
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
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import CodeIcon from '@mui/icons-material/Code';
import SearchIcon from '@mui/icons-material/Search';
import { TComposition } from '../types/resources/Composition';
import { TCompositionSection } from '../types/partials/CompositionSection';
import { TCoding } from '../types/partials/Coding';
import { TReference } from '../types/partials/Reference';
import { TDateTime } from '../types/simpleTypes/DateTime';

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

// FHIR dateTime values can be date-only or include a time component; format accordingly
// and let the caller show the raw value alongside for anyone who needs the exact string.
// dateStyle/timeStyle can't be combined with timeZoneName (Intl throws), so time values use
// individual field options instead so the viewer's local timezone abbreviation is visible.
const formatHumanDate = (value?: TDateTime): string | null => {
    if (!value) {
        return null;
    }
    const parsed = new Date(String(value));
    if (isNaN(parsed.getTime())) {
        return null;
    }
    const hasTime = String(value).includes('T');
    return parsed.toLocaleString(
        undefined,
        hasTime
            ? {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZoneName: 'short',
              }
            : { year: 'numeric', month: 'short', day: 'numeric' }
    );
};

// FHIR narrative field values are untyped strings, so a date is only recognizable by shape.
// Kept as two flat alternatives (rather than one regex with nested optional groups) to avoid
// the catastrophic-backtracking shape eslint-plugin-security's detect-unsafe-regex flags.
const DATE_ONLY_REGEX = /^\d{4}(-\d{2})?(-\d{2})?$/;
const DATE_TIME_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/;

const looksLikeIsoDate = (value: string): boolean => DATE_ONLY_REGEX.test(value) || DATE_TIME_REGEX.test(value);

const DateValue = ({ value }: { value?: TDateTime }) => {
    if (!value) {
        return <>—</>;
    }
    const humanReadable = formatHumanDate(value);
    if (!humanReadable) {
        return <>{String(value)}</>;
    }
    return (
        <>
            {humanReadable} ({String(value)})
        </>
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
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
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
    );
};

// Counts narrative leaf rows (Field | Value table rows) across a section's nested
// section[] groups, recursing through the extra nesting level used by financial/coverage domains.
const countLeafFields = (sections?: TCompositionSection[]): number => {
    if (!sections || sections.length === 0) {
        return 0;
    }
    return sections.reduce((count, s) => {
        const isLeaf = !s.section || s.section.length === 0;
        return count + (isLeaf ? 1 : countLeafFields(s.section));
    }, 0);
};

// Grabs the first `limit` non-empty leaf field values, in document order, for a
// collapsed-section preview — same traversal order as countLeafFields/SectionGroup.
const collectLeafFieldValues = (sections: TCompositionSection[] | undefined, limit: number): string[] => {
    const values: string[] = [];
    const walk = (secs?: TCompositionSection[]) => {
        if (!secs) {
            return;
        }
        for (const s of secs) {
            if (values.length >= limit) {
                return;
            }
            const isLeaf = !s.section || s.section.length === 0;
            if (isLeaf) {
                const value = s.text?.div ? String(s.text.div).trim() : '';
                if (value) {
                    values.push(value);
                }
            } else {
                walk(s.section);
            }
        }
    };
    walk(sections);
    return values;
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
                        {leafRun.map((row, index) => {
                            const value = row.text?.div ? String(row.text.div).trim() : '';
                            return (
                                <TableRow key={index}>
                                    <TableCell sx={{ fontWeight: 600, width: '35%' }}>
                                        {row.title}
                                    </TableCell>
                                    <TableCell>
                                        {value ? (looksLikeIsoDate(value) ? <DateValue value={value} /> : value) : '—'}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
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
    const [searchQuery, setSearchQuery] = useState('');
    const sectionCount = resource.section?.length || 0;
    const indexedSections = (resource.section || []).map((section, index) => ({ section, index }));
    const query = searchQuery.trim().toLowerCase();
    const filteredSections = query
        ? indexedSections.filter(({ section, index }) =>
              (section.title || `Section ${index + 1}`).toLowerCase().includes(query)
          )
        : indexedSections;
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
                                    <TableCell>
                                        <DateValue value={resource.date} />
                                    </TableCell>
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

            <TextField
                fullWidth
                size="small"
                placeholder="Search sections by name…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
                slotProps={{
                    input: {
                        startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                    },
                }}
            />

            {filteredSections.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                    No sections match &ldquo;{searchQuery}&rdquo;.
                </Typography>
            )}

            {filteredSections.map(({ section, index }) => {
                const coding = preferredCoding(section.code?.coding);
                const codingLabel = coding?.display || coding?.code;
                const title = section.title || `Section ${index + 1}`;
                const showCodingChip =
                    codingLabel && codingLabel.trim().toLowerCase() !== title.trim().toLowerCase();
                const fieldCount = countLeafFields(section.section);
                const linkCount = section.entry?.length || 0;
                const previewValues = collectLeafFieldValues(section.section, 5);
                return (
                    <Accordion key={section.id ? String(section.id) : index} sx={{ mb: 2 }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    width: '100%',
                                    mr: 1,
                                }}
                            >
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                                        <Typography variant="h6">{title}</Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {fieldCount} field{fieldCount === 1 ? '' : 's'} · {linkCount} link
                                            {linkCount === 1 ? '' : 's'}
                                        </Typography>
                                    </Box>
                                    {previewValues.length > 0 && (
                                        <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            noWrap
                                            sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
                                        >
                                            {previewValues.join(' • ')}
                                        </Typography>
                                    )}
                                </Box>
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
