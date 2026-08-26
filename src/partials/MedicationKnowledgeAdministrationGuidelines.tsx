import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMedicationKnowledgeAdministrationGuidelines } from '../types/partials/MedicationKnowledgeAdministrationGuidelines';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TMedicationKnowledgeAdministrationGuidelinesProps = TBaseResourceProps & {
  field?: string;
  administrationGuidelines: TMedicationKnowledgeAdministrationGuidelines | TMedicationKnowledgeAdministrationGuidelines[] | undefined;
};

const MedicationKnowledgeAdministrationGuidelinesField = ({
  administrationGuidelines,
  name,
  resourceType,
}: TMedicationKnowledgeAdministrationGuidelinesProps) => {
  if (!administrationGuidelines) {
    return null;
  }
  const values = Array.isArray(administrationGuidelines) ? administrationGuidelines : [administrationGuidelines];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <CodeableConcept codeableConcept={value.indicationCodeableConcept} name="Indication" resourceType={resourceType} />
          <Reference reference={value.indicationReference} name="Indication Reference" resourceType={resourceType} />
          {value.dosage && value.dosage.length > 0 && (
            <Typography component="div"><b>Dosage Count:</b>&nbsp;{value.dosage.length}</Typography>
          )}
          {value.patientCharacteristics && value.patientCharacteristics.length > 0 && (
            <Typography component="div"><b>Patient Characteristics Count:</b>&nbsp;{value.patientCharacteristics.length}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default MedicationKnowledgeAdministrationGuidelinesField;
