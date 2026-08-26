import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCompartmentDefinitionResource } from '../types/partials/CompartmentDefinitionResource';

type TCompartmentDefinitionResourceProps = TBaseResourceProps & {
  field?: string;
  resource: TCompartmentDefinitionResource | TCompartmentDefinitionResource[] | undefined;
};

const CompartmentDefinitionResource = ({ resource, name }: TCompartmentDefinitionResourceProps) => {
  if (!resource) {
    return null;
  }
  const values = Array.isArray(resource) ? resource : [resource];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Code:</b>&nbsp;{`${value.code}`}</Typography>
          {value.param && (
            <Typography component="div">
              <b>Param:</b>&nbsp;{(Array.isArray(value.param) ? value.param : [value.param]).join(', ')}
            </Typography>
          )}
          {value.documentation && (
            <Typography component="div"><b>Documentation:</b>&nbsp;{`${value.documentation}`}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CompartmentDefinitionResource;
