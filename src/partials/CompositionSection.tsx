import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCompositionSection } from '../types/partials/CompositionSection';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import StringField from './String';

type TCompositionSectionProps = TBaseResourceProps & {
  field?: string;
  section: TCompositionSection | TCompositionSection[] | undefined;
};

const CompositionSection = ({ section, name, resourceType }: TCompositionSectionProps) => {
  if (!section) {
    return null;
  }
  const values = Array.isArray(section) ? section : [section];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <StringField string={value.title} name="Title" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <Reference reference={value.author} name="Author" resourceType={resourceType} />
          <Reference reference={value.focus} name="Focus" resourceType={resourceType} />
          <StringField string={value.mode} name="Mode" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.orderedBy} name="Ordered By" resourceType={resourceType} />
          <Reference reference={value.entry} name="Entry" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.emptyReason} name="Empty Reason" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default CompositionSection;
