import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEvidenceCertainty } from '../types/partials/EvidenceCertainty';
import CodeableConcept from './CodeableConcept';
import Annotation from './Annotation';

type TEvidenceCertaintyProps = TBaseResourceProps & {
  field?: string;
  certainty: TEvidenceCertainty | TEvidenceCertainty[] | undefined;
};

const EvidenceCertainty = ({ certainty, name, resourceType }: TEvidenceCertaintyProps) => {
  if (!certainty) {
    return null;
  }
  const values = Array.isArray(certainty) ? certainty : [certainty];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.rating} name="Rating" resourceType={resourceType} />
          {value.rater && <Typography component="div"><b>Rater:</b>&nbsp;{value.rater}</Typography>}
          <Annotation annotation={value.note} name="Notes" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default EvidenceCertainty;
