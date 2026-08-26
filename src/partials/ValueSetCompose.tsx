import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TValueSetCompose } from '../types/partials/ValueSetCompose';
import { TValueSetInclude } from '../types/partials/ValueSetInclude';

type TValueSetComposeProps = TBaseResourceProps & {
  field?: string;
  compose: TValueSetCompose | TValueSetCompose[] | undefined;
};

const renderIncludeExclude = (label: string, items: TValueSetInclude[] | undefined) => {
  if (!items || items.length === 0) {
    return null;
  }
  return (
    <Box sx={{ ml: 2 }}>
      {items.filter((i) => i).map((item, index) => (
        <Typography component="div" key={index}>
          <b>{label}:</b>&nbsp;{item.system}
          {item.version && ` (version: ${item.version})`}
          {item.concept && item.concept.length > 0 && ` — ${item.concept.length} concept(s)`}
        </Typography>
      ))}
    </Box>
  );
};

const ValueSetCompose = ({ compose, name }: TValueSetComposeProps) => {
  if (!compose) {
    return null;
  }
  const values = Array.isArray(compose) ? compose : [compose];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.lockedDate && <Typography component="div"><b>Locked Date:</b>&nbsp;{String(value.lockedDate)}</Typography>}
          {value.inactive !== undefined && (
            <Typography component="div"><b>Inactive:</b>&nbsp;{String(value.inactive)}</Typography>
          )}
          {renderIncludeExclude('Include', value.include)}
          {renderIncludeExclude('Exclude', value.exclude)}
        </Box>
      ))}
    </Box>
  );
};

export default ValueSetCompose;
