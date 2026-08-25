import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TPractitionerQualification } from '../types/partials/PractitionerQualification';
import CodeableConcept from './CodeableConcept';
import Period from './Period';
import Reference from './Reference';
import Identifier from './Identifier';

type TPractitionerQualificationProps = TBaseResourceProps & {
  field?: string;
  qualification: TPractitionerQualification | TPractitionerQualification[] | undefined;
};

const PractitionerQualificationField = ({ qualification, name, resourceType }: TPractitionerQualificationProps) => {
  if (!qualification) {
    return null;
  }
  const values = Array.isArray(qualification) ? qualification : [qualification];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Identifier identifier={value.identifier} name="Identifier" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <Period period={value.period} name="Period" resourceType={resourceType} />
          <Reference reference={value.issuer} name="Issuer" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default PractitionerQualificationField;
