import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCapabilityStatementRest } from '../types/partials/CapabilityStatementRest';

type TCapabilityStatementRestProps = TBaseResourceProps & {
  field?: string;
  rest: TCapabilityStatementRest | TCapabilityStatementRest[] | undefined;
};

const CapabilityStatementRest = ({ rest, name }: TCapabilityStatementRestProps) => {
  if (!rest) {
    return null;
  }
  const values = Array.isArray(rest) ? rest : [rest];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.mode && <Typography component="div"><b>Mode:</b>&nbsp;{value.mode}</Typography>}
          {value.documentation && <Typography component="div"><b>Documentation:</b>&nbsp;{value.documentation}</Typography>}
          {value.resource && value.resource.length > 0 && (
            <Typography component="div"><b>Resource Count:</b>&nbsp;{value.resource.length}</Typography>
          )}
          {value.operation && value.operation.length > 0 && (
            <Typography component="div"><b>Operation Count:</b>&nbsp;{value.operation.length}</Typography>
          )}
          {value.compartment && value.compartment.length > 0 && (
            <Typography component="div"><b>Compartments:</b>&nbsp;{value.compartment.join(', ')}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CapabilityStatementRest;
