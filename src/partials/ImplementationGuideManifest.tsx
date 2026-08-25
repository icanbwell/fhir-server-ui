import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TImplementationGuideManifest } from '../types/partials/ImplementationGuideManifest';
import Url from './Url';
import Reference from './Reference';
import StringField from './String';

type TImplementationGuideManifestProps = TBaseResourceProps & {
  field?: string;
  manifest: TImplementationGuideManifest | TImplementationGuideManifest[] | undefined;
};

const ImplementationGuideManifestField = ({ manifest, name, resourceType }: TImplementationGuideManifestProps) => {
  if (!manifest) {
    return null;
  }
  const values = Array.isArray(manifest) ? manifest : [manifest];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Url url={value.rendering} name="Rendering" resourceType={resourceType} />
          {value.resource && value.resource.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography component="div"><b>Resources:</b></Typography>
              {value.resource.map((r, rIndex) => (
                <Reference key={rIndex} reference={r.reference} name="Resource" resourceType={resourceType} />
              ))}
            </Box>
          )}
          {value.page && value.page.length > 0 && (
            <Typography component="div">
              <b>Pages:</b>&nbsp;{value.page.map((p) => p.title || p.name).join(', ')}
            </Typography>
          )}
          <StringField string={value.image} name="Image" resourceType={resourceType} />
          <StringField string={value.other} name="Other" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ImplementationGuideManifestField;
