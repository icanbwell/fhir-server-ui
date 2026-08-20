import React from 'react';
import { Link } from 'react-router';
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
    Typography,
} from '@mui/material';
import Paper from '@mui/material/Paper';
import { TCompositionMatrix } from '../utils/compositionIndex';
import DateValue from './DateValue';

// Turns a category key like "allergyintolerance" into "Allergyintolerance". Categories come
// straight from FHIR type codes (no human-friendly display name is available), so this is a
// best-effort tidy-up rather than a full label lookup.
const humanizeCategoryKey = (key: string): string =>
    key.length ? key[0].toUpperCase() + key.slice(1) : key;

const CompositionSummaryLink: React.FC<{ id: string }> = ({ id }) => (
    <Tooltip title={id}>
        <Link to={`/composition-summary/4_0_0/Composition/${id}`} target="_blank" rel="noopener noreferrer">
            View
        </Link>
    </Tooltip>
);

const CompositionIndex: React.FC<{ personLabel: string; matrix: TCompositionMatrix }> = ({
    personLabel,
    matrix,
}) => {
    if (matrix.rows.length === 0 && matrix.other.length === 0) {
        return <Typography sx={{ mt: 2 }}>No Compositions found for {personLabel}</Typography>;
    }

    return (
        <Box sx={{ mt: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Compositions for {personLabel}
            </Typography>
            {matrix.rows.length > 0 && (
                <>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                        Health Summary Compositions
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Category</TableCell>
                                    {matrix.columns.map((column) => (
                                        <TableCell key={column.key}>
                                            {column.label}
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ display: 'block' }}
                                            >
                                                {column.source}
                                            </Typography>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {matrix.rows.map((row) => (
                                    <TableRow key={row.categoryKey}>
                                        <TableCell component="th" scope="row">
                                            {humanizeCategoryKey(row.categoryKey)}
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{ display: 'block' }}
                                            >
                                                {row.typeCodes.join(', ')}
                                            </Typography>
                                        </TableCell>
                                        {matrix.columns.map((column) => {
                                            const cells = row.cells[column.key];
                                            return (
                                                <TableCell key={column.key}>
                                                    {!cells ? (
                                                        <Typography color="text.disabled">—</Typography>
                                                    ) : (
                                                        cells.map((cell) => (
                                                            <Box key={cell.id} sx={{ mb: 0.5 }}>
                                                                <CompositionSummaryLink id={cell.id} />
                                                                <Typography
                                                                    variant="caption"
                                                                    color="text.secondary"
                                                                    sx={{ display: 'block' }}
                                                                >
                                                                    <DateValue value={cell.lastUpdated} />
                                                                </Typography>
                                                            </Box>
                                                        ))
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}

            {matrix.other.length > 0 && (
                <>
                    <Typography variant="h6" sx={{ mt: 3, mb: 1 }}>
                        Other Compositions
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Title</TableCell>
                                    <TableCell>Source</TableCell>
                                    <TableCell>Last Updated</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[...matrix.other]
                                    .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
                                    .map((entry) => (
                                        <TableRow key={entry.id}>
                                            <TableCell>
                                                {entry.title ?? '(no title)'}
                                                {entry.typeCode && (
                                                    <Typography
                                                        variant="caption"
                                                        color="text.secondary"
                                                        sx={{ display: 'block' }}
                                                    >
                                                        {entry.typeCode}
                                                    </Typography>
                                                )}
                                            </TableCell>
                                            <TableCell>{entry.source ?? '—'}</TableCell>
                                            <TableCell>
                                                <DateValue value={entry.lastUpdated} />
                                            </TableCell>
                                            <TableCell>
                                                <CompositionSummaryLink id={entry.id} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Box>
    );
};

export default CompositionIndex;
