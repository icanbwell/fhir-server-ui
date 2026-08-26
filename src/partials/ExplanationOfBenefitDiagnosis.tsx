import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TExplanationOfBenefitDiagnosis } from '../types/partials/ExplanationOfBenefitDiagnosis';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TExplanationOfBenefitDiagnosisProps = TBaseResourceProps & {
  field?: string;
  diagnosis: TExplanationOfBenefitDiagnosis | TExplanationOfBenefitDiagnosis[] | undefined;
};

const ExplanationOfBenefitDiagnosis = ({ diagnosis, name, resourceType }: TExplanationOfBenefitDiagnosisProps) => {
  if (!diagnosis) {
    return null;
  }
  const values = Array.isArray(diagnosis) ? diagnosis : [diagnosis];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Sequence:</b>&nbsp;{`${value.sequence}`}</Typography>
          <CodeableConcept codeableConcept={value.diagnosisCodeableConcept} name="Diagnosis" resourceType={resourceType} />
          <Reference reference={value.diagnosisReference} name="Diagnosis Reference" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.onAdmission} name="On Admission" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.packageCode} name="Package Code" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ExplanationOfBenefitDiagnosis;
