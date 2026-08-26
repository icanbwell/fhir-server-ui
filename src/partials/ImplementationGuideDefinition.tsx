import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TImplementationGuideDefinition } from '../types/partials/ImplementationGuideDefinition';
import Reference from './Reference';

type TImplementationGuideDefinitionProps = TBaseResourceProps & {
  field?: string;
  definition: TImplementationGuideDefinition | TImplementationGuideDefinition[] | undefined;
};

const ImplementationGuideDefinitionField = ({ definition, name, resourceType }: TImplementationGuideDefinitionProps) => {
  if (!definition) {
    return null;
  }
  const values = Array.isArray(definition) ? definition : [definition];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.grouping && value.grouping.length > 0 && (
            <Typography component="div">
              <b>Groupings:</b>&nbsp;{value.grouping.map((g) => g.name).join(', ')}
            </Typography>
          )}
          {value.resource && value.resource.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography component="div"><b>Resources:</b></Typography>
              {value.resource.map((r, rIndex) => (
                <Reference key={rIndex} reference={r.reference} name={r.name || 'Resource'} resourceType={resourceType} />
              ))}
            </Box>
          )}
          {value.page && value.page.title && (
            <Typography component="div"><b>Page:</b>&nbsp;{value.page.title}</Typography>
          )}
          {value.parameter && value.parameter.length > 0 && (
            <Typography component="div">
              <b>Parameters:</b>&nbsp;{value.parameter.map((p) => `${p.code}=${p.value}`).join(', ')}
            </Typography>
          )}
          {value.template && value.template.length > 0 && (
            <Typography component="div">
              <b>Templates:</b>&nbsp;{value.template.map((t) => `${t.code} (${t.source})`).join(', ')}
            </Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ImplementationGuideDefinitionField;
