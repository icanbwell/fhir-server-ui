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
import { TSubscriptionChannel } from '../types/partials/SubscriptionChannel';

type TSubscriptionChannelProps = TBaseResourceProps & {
    channel: TSubscriptionChannel | TSubscriptionChannel[] | undefined;
    field?: string;
};

const SubscriptionChannelPartial = ({ channel, name }: TSubscriptionChannelProps) => {
    const entries = channel ? (Array.isArray(channel) ? channel : [channel]) : [];
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
                            <TableCell>Type</TableCell>
                            <TableCell>Endpoint</TableCell>
                            <TableCell>Payload</TableCell>
                            <TableCell>Header</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.map((entry, index) => (
                            <TableRow key={`${index}`}>
                                <TableCell>{String(entry.type ?? '')}</TableCell>
                                <TableCell>{String(entry.endpoint ?? '')}</TableCell>
                                <TableCell>{String(entry.payload ?? '')}</TableCell>
                                <TableCell>{entry.header ? entry.header.join(', ') : ''}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SubscriptionChannelPartial;
