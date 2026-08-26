import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TConsentProvision } from '../types/partials/ConsentProvision';
import CodeableConcept from './CodeableConcept';
import Coding from './Coding';
import Period from './Period';
import StringField from './String';

type TConsentProvisionProps = TBaseResourceProps & {
  field?: string;
  provision: TConsentProvision | TConsentProvision[] | undefined;
};

const ConsentProvision = ({ provision, name, resourceType }: TConsentProvisionProps) => {
  if (!provision) {
    return null;
  }
  const values = Array.isArray(provision) ? provision : [provision];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <StringField string={value.type} name="Type" resourceType={resourceType} />
          <Period period={value.period} name="Period" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.action} name="Action" resourceType={resourceType} />
          <Coding coding={value.securityLabel} name="Security Label" resourceType={resourceType} />
          <Coding coding={value.purpose} name="Purpose" resourceType={resourceType} />
          <Coding coding={value.class_} name="Class" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <Period period={value.dataPeriod} name="Data Period" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ConsentProvision;
