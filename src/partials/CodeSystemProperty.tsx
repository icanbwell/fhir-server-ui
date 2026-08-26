import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCodeSystemProperty } from '../types/partials/CodeSystemProperty';
import Uri from './Uri';

type TCodeSystemPropertyProps = TBaseResourceProps & {
  field?: string;
  property: TCodeSystemProperty | TCodeSystemProperty[] | undefined;
};

const CodeSystemProperty = ({ property, name, resourceType }: TCodeSystemPropertyProps) => {
  if (!property) {
    return null;
  }
  const values = Array.isArray(property) ? property : [property];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Code:</b>&nbsp;{`${value.code}`}</Typography>
          <Typography component="div"><b>Type:</b>&nbsp;{`${value.type}`}</Typography>
          <Uri uri={value.uri} name="URI" resourceType={resourceType} />
          {value.description && (
            <Typography component="div"><b>Description:</b>&nbsp;{`${value.description}`}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CodeSystemProperty;
