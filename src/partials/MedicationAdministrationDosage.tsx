import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMedicationAdministrationDosage } from '../types/partials/MedicationAdministrationDosage';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Ratio from './Ratio';

type TMedicationAdministrationDosageProps = TBaseResourceProps & {
  field?: string;
  dosage: TMedicationAdministrationDosage | TMedicationAdministrationDosage[] | undefined;
};

const MedicationAdministrationDosageField = ({ dosage, name, resourceType }: TMedicationAdministrationDosageProps) => {
  if (!dosage) {
    return null;
  }
  const values = Array.isArray(dosage) ? dosage : [dosage];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          {value.text && <Typography component="div"><b>Text:</b>&nbsp;{value.text}</Typography>}
          <CodeableConcept codeableConcept={value.site} name="Site" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.route} name="Route" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.method} name="Method" resourceType={resourceType} />
          <Quantity quantity={value.dose} name="Dose" resourceType={resourceType} />
          <Ratio ratio={value.rateRatio} name="Rate Ratio" resourceType={resourceType} />
          <Quantity quantity={value.rateQuantity} name="Rate Quantity" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default MedicationAdministrationDosageField;
