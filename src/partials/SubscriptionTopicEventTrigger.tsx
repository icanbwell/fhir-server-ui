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
import { TSubscriptionTopicEventTrigger } from '../types/partials/SubscriptionTopicEventTrigger';

type TProps = TBaseResourceProps & {
    eventTrigger: TSubscriptionTopicEventTrigger | TSubscriptionTopicEventTrigger[] | undefined;
    field?: string;
};

// Mirrors the inline valueCodeableConcept summary Extension.tsx already uses elsewhere in
// this codebase, rather than nesting the full boxed CodeableConcept partial inside a table cell.
const describeCodeableConcept = (concept: TSubscriptionTopicEventTrigger['event']): string => {
    if (!concept) {
        return '';
    }
    if (concept.coding && concept.coding.length > 0) {
        return `${concept.coding[0].code || ''}${concept.text ? ` (${concept.text})` : ''}`;
    }
    return String(concept.text ?? '');
};

const SubscriptionTopicEventTriggerPartial = ({ eventTrigger, name }: TProps) => {
    const entries = eventTrigger ? (Array.isArray(eventTrigger) ? eventTrigger : [eventTrigger]) : [];
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
                            <TableCell>Event</TableCell>
                            <TableCell>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.map((entry, index) => (
                            <TableRow key={`${index}`}>
                                <TableCell>{String(entry.resource ?? '')}</TableCell>
                                <TableCell>{describeCodeableConcept(entry.event)}</TableCell>
                                <TableCell>{String(entry.description ?? '')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SubscriptionTopicEventTriggerPartial;
