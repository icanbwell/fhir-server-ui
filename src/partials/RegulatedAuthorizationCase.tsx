import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TRegulatedAuthorizationCase } from '../types/partials/RegulatedAuthorizationCase';
import CodeableConcept from './CodeableConcept';
import Identifier from './Identifier';
import Period from './Period';
import DateTime from './DateTime';

type TRegulatedAuthorizationCaseProps = TBaseResourceProps & {
  field?: string;
  case: TRegulatedAuthorizationCase | TRegulatedAuthorizationCase[] | undefined;
};

const RegulatedAuthorizationCaseField = ({ case: caseValue, name, resourceType }: TRegulatedAuthorizationCaseProps) => {
  if (!caseValue) {
    return null;
  }
  const values = Array.isArray(caseValue) ? caseValue : [caseValue];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Identifier identifier={value.identifier} name="Identifier" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.status} name="Status" resourceType={resourceType} />
          <Period period={value.datePeriod} name="Date Period" resourceType={resourceType} />
          <DateTime dateTime={value.dateDateTime} name="Date" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default RegulatedAuthorizationCaseField;
