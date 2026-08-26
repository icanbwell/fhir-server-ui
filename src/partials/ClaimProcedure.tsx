import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClaimProcedure } from '../types/partials/ClaimProcedure';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import DateTime from './DateTime';

type TClaimProcedureProps = TBaseResourceProps & {
  field?: string;
  procedure: TClaimProcedure | TClaimProcedure[] | undefined;
};

const ClaimProcedure = ({ procedure, name, resourceType }: TClaimProcedureProps) => {
  if (!procedure) {
    return null;
  }
  const values = Array.isArray(procedure) ? procedure : [procedure];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.sequence !== undefined && value.sequence !== null && (
            <Typography component="div"><b>Sequence:</b>&nbsp;{`${value.sequence}`}</Typography>
          )}
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <DateTime dateTime={value.date} name="Date" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.procedureCodeableConcept} name="Procedure" resourceType={resourceType} />
          <Reference reference={value.procedureReference} name="Procedure Reference" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ClaimProcedure;
