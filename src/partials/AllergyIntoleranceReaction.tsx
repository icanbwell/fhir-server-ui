import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TAllergyIntoleranceReaction } from '../types/partials/AllergyIntoleranceReaction';
import CodeableConcept from './CodeableConcept';
import DateTime from './DateTime';
import Annotation from './Annotation';

type TAllergyIntoleranceReactionProps = TBaseResourceProps & {
  field?: string;
  reaction: TAllergyIntoleranceReaction | TAllergyIntoleranceReaction[] | undefined;
};

const AllergyIntoleranceReaction = ({ reaction, name, resourceType }: TAllergyIntoleranceReactionProps) => {
  if (!reaction) {
    return null;
  }
  const values = Array.isArray(reaction) ? reaction : [reaction];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.substance} name="Substance" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.manifestation} name="Manifestation" resourceType={resourceType} />
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
          <DateTime dateTime={value.onset} name="Onset" resourceType={resourceType} />
          {value.severity && <Typography component="div"><b>Severity:</b>&nbsp;{value.severity}</Typography>}
          <CodeableConcept codeableConcept={value.exposureRoute} name="Exposure Route" resourceType={resourceType} />
          <Annotation annotation={value.note} name="Note" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default AllergyIntoleranceReaction;
