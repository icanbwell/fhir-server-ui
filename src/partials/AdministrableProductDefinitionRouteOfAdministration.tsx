import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TAdministrableProductDefinitionRouteOfAdministration } from '../types/partials/AdministrableProductDefinitionRouteOfAdministration';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Ratio from './Ratio';

type TAdministrableProductDefinitionRouteOfAdministrationProps = TBaseResourceProps & {
  field?: string;
  routeOfAdministration: TAdministrableProductDefinitionRouteOfAdministration | TAdministrableProductDefinitionRouteOfAdministration[] | undefined;
};

const AdministrableProductDefinitionRouteOfAdministration = ({
  routeOfAdministration,
  name,
  resourceType,
}: TAdministrableProductDefinitionRouteOfAdministrationProps) => {
  if (!routeOfAdministration) {
    return null;
  }
  const values = Array.isArray(routeOfAdministration) ? routeOfAdministration : [routeOfAdministration];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <Quantity quantity={value.firstDose} name="First Dose" resourceType={resourceType} />
          <Quantity quantity={value.maxSingleDose} name="Max Single Dose" resourceType={resourceType} />
          <Quantity quantity={value.maxDosePerDay} name="Max Dose Per Day" resourceType={resourceType} />
          <Ratio ratio={value.maxDosePerTreatmentPeriod} name="Max Dose Per Treatment Period" resourceType={resourceType} />
          <Quantity quantity={value.maxTreatmentPeriod} name="Max Treatment Period" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default AdministrableProductDefinitionRouteOfAdministration;
