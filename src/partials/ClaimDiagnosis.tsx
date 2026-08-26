import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClaimDiagnosis } from '../types/partials/ClaimDiagnosis';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TClaimDiagnosisProps = TBaseResourceProps & {
  field?: string;
  diagnosis: TClaimDiagnosis | TClaimDiagnosis[] | undefined;
};

const ClaimDiagnosis = ({ diagnosis, name, resourceType }: TClaimDiagnosisProps) => {
  if (!diagnosis) {
    return null;
  }
  const values = Array.isArray(diagnosis) ? diagnosis : [diagnosis];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.sequence !== undefined && value.sequence !== null && (
            <Typography component="div"><b>Sequence:</b>&nbsp;{`${value.sequence}`}</Typography>
          )}
          <CodeableConcept codeableConcept={value.diagnosisCodeableConcept} name="Diagnosis" resourceType={resourceType} />
          <Reference reference={value.diagnosisReference} name="Diagnosis Reference" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.onAdmission} name="On Admission" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ClaimDiagnosis;
