import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCodeSystemConcept } from '../types/partials/CodeSystemConcept';

type TCodeSystemConceptProps = TBaseResourceProps & {
  field?: string;
  concept: TCodeSystemConcept | TCodeSystemConcept[] | undefined;
};

const CodeSystemConcept = ({ concept, name }: TCodeSystemConceptProps) => {
  if (!concept) {
    return null;
  }
  const values = Array.isArray(concept) ? concept : [concept];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Code:</b>&nbsp;{`${value.code}`}</Typography>
          {value.display && (
            <Typography component="div"><b>Display:</b>&nbsp;{`${value.display}`}</Typography>
          )}
          {value.definition && (
            <Typography component="div"><b>Definition:</b>&nbsp;{`${value.definition}`}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CodeSystemConcept;
