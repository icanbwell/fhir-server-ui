import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Paper, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEncounterClassHistory } from '../types/partials/EncounterClassHistory';

type TEncounterClassHistoryProps = TBaseResourceProps & {
    classHistory: TEncounterClassHistory | TEncounterClassHistory[] | undefined;
    // Always passed as an empty string by the generated Encounter.tsx (via partials_mapping_for_fields.py); unused here.
    field?: string;
};

const EncounterClassHistoryPartial = ({ classHistory, name }: TEncounterClassHistoryProps) => {
    const entries = classHistory ? (Array.isArray(classHistory) ? classHistory : [classHistory]) : [];
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
                            <TableCell>Class Code</TableCell>
                            <TableCell>Start</TableCell>
                            <TableCell>End</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.map((entry, index) => (
                            <TableRow key={index}>
                                <TableCell>{entry.class_?.code}</TableCell>
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

export default EncounterClassHistoryPartial;
