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
import { TSubscriptionStatusNotificationEvent } from '../types/partials/SubscriptionStatusNotificationEvent';
import { TInstant } from '../types/simpleTypes/Instant';
import { formatDurationBetween, formatHumanDate } from '../utils/dateFormat';

// timestamp is typed TInstant (String | Date); formatDurationBetween/formatHumanDate take the
// narrower TDateTime (String), so normalize to a plain string (or undefined) before calling them.
const toTimestampString = (value?: TInstant): string | undefined =>
    value === undefined ? undefined : String(value);

type TSubscriptionStatusNotificationEventProps = TBaseResourceProps & {
    notificationEvent: TSubscriptionStatusNotificationEvent | TSubscriptionStatusNotificationEvent[] | undefined;
    // Always passed as an empty string by the generated SubscriptionStatus.tsx (via
    // partials_mapping_for_fields.py); unused here — see EncounterDiagnosis.tsx for precedent.
    field?: string;
};

const SubscriptionStatusNotificationEventPartial = ({
    notificationEvent,
    name,
}: TSubscriptionStatusNotificationEventProps) => {
    const entries = notificationEvent
        ? Array.isArray(notificationEvent)
            ? notificationEvent
            : [notificationEvent]
        : [];
    if (entries.length === 0) {
        return null;
    }

    // The array's wire order is not guaranteed to be chronological (the server's own example
    // payload isn't) — eventNumber is the authoritative row order for computing "time since
    // previous row".
    const sorted = [...entries].sort((a, b) => Number(a.eventNumber) - Number(b.eventNumber));

    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            <TableContainer component={Paper} variant="outlined">
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Id</TableCell>
                            <TableCell>Timestamp</TableCell>
                            <TableCell>Time Since Previous</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sorted.map((event, index) => {
                            const previous = index > 0 ? sorted[index - 1] : undefined;
                            const eventTimestamp = toTimestampString(event.timestamp);
                            const duration = previous
                                ? formatDurationBetween(toTimestampString(previous.timestamp), eventTimestamp)
                                : null;
                            return (
                                <TableRow key={`${index}`}>
                                    <TableCell>{String(event.id ?? '')}</TableCell>
                                    <TableCell>{formatHumanDate(eventTimestamp) ?? eventTimestamp ?? ''}</TableCell>
                                    <TableCell>{duration ?? '—'}</TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SubscriptionStatusNotificationEventPartial;
