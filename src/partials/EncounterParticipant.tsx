import { Box, Typography } from '@mui/material';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Period from './Period';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEncounterParticipant } from '../types/partials/EncounterParticipant';

type TEncounterParticipantProps = TBaseResourceProps & {
    participant: TEncounterParticipant | TEncounterParticipant[] | undefined;
    // Always passed as an empty string by the generated Encounter.tsx (via partials_mapping_for_fields.py); unused here.
    field?: string;
};

const EncounterParticipantPartial = ({ participant, name, resourceType, id }: TEncounterParticipantProps) => {
    const entries = participant ? (Array.isArray(participant) ? participant : [participant]) : [];
    if (entries.length === 0) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            {entries.map((entry, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                    {entry.type && <CodeableConcept codeableConcept={entry.type} name="Type" resourceType={resourceType} id={id} />}
                    {entry.period && <Period period={entry.period} name="Period" resourceType={resourceType} id={id} />}
                    {entry.individual && (
                        <Reference reference={entry} field="individual" resourceType={resourceType} id={id} searchParameter="participant" />
                    )}
                </Box>
            ))}
        </Box>
    );
};

export default EncounterParticipantPartial;
