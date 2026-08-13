import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEncounterStatusHistory } from '../types/partials/EncounterStatusHistory';

type TEncounterStatusHistoryProps = TBaseResourceProps & {
    statusHistory: TEncounterStatusHistory | TEncounterStatusHistory[] | undefined;
    // Always passed as an empty string by the generated Encounter.tsx (via partials_mapping_for_fields.py); unused here.
    field?: string;
};

const EncounterStatusHistoryPartial = ({ statusHistory, name }: TEncounterStatusHistoryProps) => {
    const entries = statusHistory ? (Array.isArray(statusHistory) ? statusHistory : [statusHistory]) : [];
    if (entries.length === 0) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Status</TableCell>
                            <TableCell>Start</TableCell>
                            <TableCell>End</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell>{entry.status}</TableCell>
                                <TableCell>{entry.period?.start}</TableCell>
                                <TableCell>{entry.period?.end}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default EncounterStatusHistoryPartial;
