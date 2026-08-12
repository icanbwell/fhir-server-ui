import { Box, Typography } from '@mui/material';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEncounterDiagnosis } from '../types/partials/EncounterDiagnosis';

type TEncounterDiagnosisProps = TBaseResourceProps & {
    diagnosis: TEncounterDiagnosis | TEncounterDiagnosis[] | undefined;
    // Always passed as an empty string by the generated Encounter.tsx (via partials_mapping_for_fields.py); unused here.
    field?: string;
};

const EncounterDiagnosisPartial = ({ diagnosis, name, resourceType, id }: TEncounterDiagnosisProps) => {
    const entries = diagnosis ? (Array.isArray(diagnosis) ? diagnosis : [diagnosis]) : [];
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
                    {entry.rank !== undefined && (
                        <Typography variant="body2" color="text.secondary">
                            Rank: {String(entry.rank)}
                        </Typography>
                    )}
                    {entry.use && <CodeableConcept codeableConcept={entry.use} name="Use" resourceType={resourceType} id={id} />}
                    <Reference reference={entry} field="condition" resourceType={resourceType} id={id} searchParameter="diagnosis" />
                </Box>
            ))}
        </Box>
    );
};

export default EncounterDiagnosisPartial;
