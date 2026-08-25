import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCitationSummary } from '../types/partials/CitationSummary';
import CodeableConcept from './CodeableConcept';

type TCitationSummaryProps = TBaseResourceProps & {
  field?: string;
  summary: TCitationSummary | TCitationSummary[] | undefined;
};

const CitationSummary = ({ summary, name, resourceType }: TCitationSummaryProps) => {
  if (!summary) {
    return null;
  }
  const values = Array.isArray(summary) ? summary : [summary];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.style} name="Style" resourceType={resourceType} />
          {value.text && (
            <Typography component="div"><b>Text:</b>&nbsp;{value.text}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CitationSummary;
