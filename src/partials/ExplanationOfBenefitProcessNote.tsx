import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TExplanationOfBenefitProcessNote } from '../types/partials/ExplanationOfBenefitProcessNote';
import CodeableConcept from './CodeableConcept';

type TExplanationOfBenefitProcessNoteProps = TBaseResourceProps & {
  field?: string;
  processNote: TExplanationOfBenefitProcessNote | TExplanationOfBenefitProcessNote[] | undefined;
};

const ExplanationOfBenefitProcessNote = ({ processNote, name, resourceType }: TExplanationOfBenefitProcessNoteProps) => {
  if (!processNote) {
    return null;
  }
  const values = Array.isArray(processNote) ? processNote : [processNote];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.number !== undefined && value.number !== null && (
            <Typography component="div"><b>Number:</b>&nbsp;{`${value.number}`}</Typography>
          )}
          {value.type && <Typography component="div"><b>Type:</b>&nbsp;{`${value.type}`}</Typography>}
          {value.text && <Typography component="div"><b>Text:</b>&nbsp;{`${value.text}`}</Typography>}
          <CodeableConcept codeableConcept={value.language} name="Language" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ExplanationOfBenefitProcessNote;
