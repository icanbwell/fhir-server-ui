import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCitationCitedArtifact } from '../types/partials/CitationCitedArtifact';
import Identifier from './Identifier';
import CodeableConcept from './CodeableConcept';
import DateTime from './DateTime';
import Annotation from './Annotation';

type TCitationCitedArtifactProps = TBaseResourceProps & {
  field?: string;
  citedArtifact: TCitationCitedArtifact | TCitationCitedArtifact[] | undefined;
};

const CitationCitedArtifact = ({ citedArtifact, name, resourceType }: TCitationCitedArtifactProps) => {
  if (!citedArtifact) {
    return null;
  }
  const values = Array.isArray(citedArtifact) ? citedArtifact : [citedArtifact];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Identifier identifier={value.identifier} name="Identifier" resourceType={resourceType} />
          {value.title?.map((title, titleIndex) => (
            <Box key={titleIndex}>
              {title.text && (
                <Typography component="div"><b>Title:</b>&nbsp;{title.text}</Typography>
              )}
            </Box>
          ))}
          {value.abstract?.map((abstractItem, abstractIndex) => (
            <Box key={abstractIndex}>
              {abstractItem.text && (
                <Typography component="div"><b>Abstract:</b>&nbsp;{abstractItem.text}</Typography>
              )}
            </Box>
          ))}
          <CodeableConcept codeableConcept={value.currentState} name="Current State" resourceType={resourceType} />
          <DateTime dateTime={value.dateAccessed} name="Date Accessed" resourceType={resourceType} />
          <Annotation annotation={value.note} name="Notes" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default CitationCitedArtifact;
