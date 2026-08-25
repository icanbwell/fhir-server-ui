import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TConceptMapGroup } from '../types/partials/ConceptMapGroup';
import Uri from './Uri';
import StringField from './String';

type TConceptMapGroupProps = TBaseResourceProps & {
  field?: string;
  group: TConceptMapGroup | TConceptMapGroup[] | undefined;
};

const ConceptMapGroup = ({ group, name, resourceType }: TConceptMapGroupProps) => {
  if (!group) {
    return null;
  }
  const values = Array.isArray(group) ? group : [group];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Uri uri={value.source} name="Source" resourceType={resourceType} />
          <StringField string={value.sourceVersion} name="Source Version" resourceType={resourceType} />
          <Uri uri={value.target} name="Target" resourceType={resourceType} />
          <StringField string={value.targetVersion} name="Target Version" resourceType={resourceType} />
          {value.element && (
            <Typography component="div"><b>Element Mappings:</b>&nbsp;{value.element.length}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ConceptMapGroup;
