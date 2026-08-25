import {
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TSubscriptionTopicCanFilterBy } from '../types/partials/SubscriptionTopicCanFilterBy';

type TProps = TBaseResourceProps & {
    canFilterBy: TSubscriptionTopicCanFilterBy | TSubscriptionTopicCanFilterBy[] | undefined;
    field?: string;
};

const SubscriptionTopicCanFilterByPartial = ({ canFilterBy, name }: TProps) => {
    const entries = canFilterBy ? (Array.isArray(canFilterBy) ? canFilterBy : [canFilterBy]) : [];
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
                            <TableCell>Resource</TableCell>
                            <TableCell>Filter Parameter</TableCell>
                            <TableCell>Filter Definition</TableCell>
                            <TableCell>Modifier</TableCell>
                            <TableCell>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.map((entry, index) => (
                            <TableRow key={`${index}`}>
                                <TableCell>{String(entry.resource ?? '')}</TableCell>
                                <TableCell>{String(entry.filterParameter ?? '')}</TableCell>
                                <TableCell>{String(entry.filterDefinition ?? '')}</TableCell>
                                <TableCell>{entry.modifier ? entry.modifier.join(', ') : ''}</TableCell>
                                <TableCell>{String(entry.description ?? '')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SubscriptionTopicCanFilterByPartial;
