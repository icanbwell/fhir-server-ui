import { Box, Typography } from '@mui/material';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEncounterHospitalization } from '../types/partials/EncounterHospitalization';

type TEncounterHospitalizationProps = TBaseResourceProps & {
    hospitalization: TEncounterHospitalization | undefined;
    // Always passed as an empty string by the generated Encounter.tsx (via partials_mapping_for_fields.py); unused here.
    field?: string;
};

const EncounterHospitalizationPartial = ({ hospitalization, name, resourceType, id }: TEncounterHospitalizationProps) => {
    if (!hospitalization) {
        return null;
    }
    return (
        <Box>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {name}
            </Typography>
            {hospitalization.origin && (
                <Reference reference={hospitalization} field="origin" name="Origin" resourceType={resourceType} id={id} searchParameter="hospitalization" />
            )}
            {hospitalization.admitSource && (
                <CodeableConcept codeableConcept={hospitalization.admitSource} name="Admit Source" resourceType={resourceType} id={id} />
            )}
            {hospitalization.reAdmission && (
                <CodeableConcept codeableConcept={hospitalization.reAdmission} name="Re-Admission" resourceType={resourceType} id={id} />
            )}
            {hospitalization.dietPreference && (
                <CodeableConcept codeableConcept={hospitalization.dietPreference} name="Diet Preference" resourceType={resourceType} id={id} />
            )}
            {hospitalization.specialCourtesy && (
                <CodeableConcept codeableConcept={hospitalization.specialCourtesy} name="Special Courtesy" resourceType={resourceType} id={id} />
            )}
            {hospitalization.specialArrangement && (
                <CodeableConcept codeableConcept={hospitalization.specialArrangement} name="Special Arrangement" resourceType={resourceType} id={id} />
            )}
            {hospitalization.destination && (
                <Reference reference={hospitalization} field="destination" name="Destination" resourceType={resourceType} id={id} searchParameter="hospitalization" />
            )}
            {hospitalization.dischargeDisposition && (
                <CodeableConcept codeableConcept={hospitalization.dischargeDisposition} name="Discharge Disposition" resourceType={resourceType} id={id} />
            )}
        </Box>
    );
};

export default EncounterHospitalizationPartial;
