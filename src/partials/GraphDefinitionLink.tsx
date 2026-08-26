import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TGraphDefinitionLink } from '../types/partials/GraphDefinitionLink';

type TGraphDefinitionLinkProps = TBaseResourceProps & {
  field?: string;
  link: TGraphDefinitionLink | TGraphDefinitionLink[] | undefined;
};

const GraphDefinitionLink = ({ link, name }: TGraphDefinitionLinkProps) => {
  if (!link) {
    return null;
  }
  const values = Array.isArray(link) ? link : [link];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.path && <Typography component="div"><b>Path:</b>&nbsp;{`${value.path}`}</Typography>}
          {value.sliceName && <Typography component="div"><b>Slice Name:</b>&nbsp;{`${value.sliceName}`}</Typography>}
          {value.min !== undefined && value.min !== null && (
            <Typography component="div"><b>Min:</b>&nbsp;{`${value.min}`}</Typography>
          )}
          {value.max && <Typography component="div"><b>Max:</b>&nbsp;{`${value.max}`}</Typography>}
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{`${value.description}`}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default GraphDefinitionLink;
