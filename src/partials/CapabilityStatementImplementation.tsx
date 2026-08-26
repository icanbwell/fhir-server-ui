import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCapabilityStatementImplementation } from '../types/partials/CapabilityStatementImplementation';
import Reference from './Reference';
import Url from './Url';

type TCapabilityStatementImplementationProps = TBaseResourceProps & {
  field?: string;
  implementation: TCapabilityStatementImplementation | TCapabilityStatementImplementation[] | undefined;
};

const CapabilityStatementImplementation = ({ implementation, name, resourceType }: TCapabilityStatementImplementationProps) => {
  if (!implementation) {
    return null;
  }
  const values = Array.isArray(implementation) ? implementation : [implementation];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.description && (
            <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>
          )}
          <Url url={value.url} name="URL" resourceType={resourceType} />
          <Reference reference={value.custodian} name="Custodian" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default CapabilityStatementImplementation;
