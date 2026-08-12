import { Box, Typography } from '@mui/material';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Period from './Period';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEncounterLocation } from '../types/partials/EncounterLocation';

type TEncounterLocationProps = TBaseResourceProps & {
    location: TEncounterLocation | TEncounterLocation[] | undefined;
    // Always passed as an empty string by the generated Encounter.tsx (via partials_mapping_for_fields.py); unused here.
    field?: string;
};

const EncounterLocationPartial = ({ location, name, resourceType, id }: TEncounterLocationProps) => {
    const entries = location ? (Array.isArray(location) ? location : [location]) : [];
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
                    {entry.status && (
                        <Typography variant="body2" color="text.secondary">
                            Status: {String(entry.status)}
                        </Typography>
                    )}
                    {entry.physicalType && (
                        <CodeableConcept codeableConcept={entry.physicalType} name="Physical Type" resourceType={resourceType} id={id} />
                    )}
                    {entry.period && <Period period={entry.period} name="Period" resourceType={resourceType} id={id} />}
                    <Reference reference={entry} field="location" name="Location" resourceType={resourceType} id={id} searchParameter="location" />
                </Box>
            ))}
        </Box>
    );
};

export default EncounterLocationPartial;
