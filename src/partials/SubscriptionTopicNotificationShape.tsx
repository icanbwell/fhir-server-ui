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
import { TSubscriptionTopicNotificationShape } from '../types/partials/SubscriptionTopicNotificationShape';

type TProps = TBaseResourceProps & {
    notificationShape: TSubscriptionTopicNotificationShape | TSubscriptionTopicNotificationShape[] | undefined;
    field?: string;
};

const SubscriptionTopicNotificationShapePartial = ({ notificationShape, name }: TProps) => {
    const entries = notificationShape ? (Array.isArray(notificationShape) ? notificationShape : [notificationShape]) : [];
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
                            <TableCell>Include</TableCell>
                            <TableCell>Rev Include</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.map((entry, index) => (
                            <TableRow key={`${index}`}>
                                <TableCell>{String(entry.resource ?? '')}</TableCell>
                                <TableCell>{entry.include ? entry.include.join(', ') : ''}</TableCell>
                                <TableCell>{entry.revInclude ? entry.revInclude.join(', ') : ''}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SubscriptionTopicNotificationShapePartial;
