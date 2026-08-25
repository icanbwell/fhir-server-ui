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
import { TSubscriptionTopicResourceTrigger } from '../types/partials/SubscriptionTopicResourceTrigger';

type TProps = TBaseResourceProps & {
    resourceTrigger: TSubscriptionTopicResourceTrigger | TSubscriptionTopicResourceTrigger[] | undefined;
    field?: string;
};

const describeQueryCriteria = (entry: TSubscriptionTopicResourceTrigger): string => {
    const qc = entry.queryCriteria;
    if (!qc) {
        return '';
    }
    const parts: string[] = [];
    if (qc.previous !== undefined) {
        parts.push(`previous: ${qc.previous}`);
    }
    if (qc.resultForCreate !== undefined) {
        parts.push(`resultForCreate: ${qc.resultForCreate}`);
    }
    if (qc.current !== undefined) {
        parts.push(`current: ${qc.current}`);
    }
    if (qc.resultForDelete !== undefined) {
        parts.push(`resultForDelete: ${qc.resultForDelete}`);
    }
    if (qc.requireBoth !== undefined) {
        parts.push(`requireBoth: ${String(qc.requireBoth)}`);
    }
    return parts.join(', ');
};

const SubscriptionTopicResourceTriggerPartial = ({ resourceTrigger, name }: TProps) => {
    const entries = resourceTrigger ? (Array.isArray(resourceTrigger) ? resourceTrigger : [resourceTrigger]) : [];
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
                            <TableCell>Description</TableCell>
                            <TableCell>Supported Interaction</TableCell>
                            <TableCell>Query Criteria</TableCell>
                            <TableCell>FHIR Path Criteria</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {entries.map((entry, index) => (
                            <TableRow key={`${index}`}>
                                <TableCell>{String(entry.resource ?? '')}</TableCell>
                                <TableCell>{String(entry.description ?? '')}</TableCell>
                                <TableCell>
                                    {entry.supportedInteraction ? entry.supportedInteraction.join(', ') : ''}
                                </TableCell>
                                <TableCell>{describeQueryCriteria(entry)}</TableCell>
                                <TableCell>{String(entry.fhirPathCriteria ?? '')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default SubscriptionTopicResourceTriggerPartial;
