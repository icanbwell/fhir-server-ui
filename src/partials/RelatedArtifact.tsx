import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TRelatedArtifact } from '../types/partials/RelatedArtifact';

type TRelatedArtifactProps = TBaseResourceProps & {
  relatedArtifact: TRelatedArtifact | TRelatedArtifact[] | undefined;
};

const RelatedArtifactField = ({ relatedArtifact, name }: TRelatedArtifactProps) => {
  if (!relatedArtifact) {
    return null;
  }
  const values = Array.isArray(relatedArtifact) ? relatedArtifact : [relatedArtifact];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Type:</b>&nbsp;{value.type}</Typography>
          {value.label && <Typography component="div"><b>Label:</b>&nbsp;{value.label}</Typography>}
          {value.display && <Typography component="div"><b>Display:</b>&nbsp;{value.display}</Typography>}
          {value.citation && <Typography component="div"><b>Citation:</b>&nbsp;{value.citation}</Typography>}
          {value.url && <Typography component="div"><b>URL:</b>&nbsp;{value.url}</Typography>}
          {value.resource && <Typography component="div"><b>Resource:</b>&nbsp;{value.resource}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default RelatedArtifactField;
