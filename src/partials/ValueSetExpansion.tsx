import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TValueSetExpansion } from '../types/partials/ValueSetExpansion';

type TValueSetExpansionProps = TBaseResourceProps & {
  field?: string;
  expansion: TValueSetExpansion | TValueSetExpansion[] | undefined;
};

const ValueSetExpansion = ({ expansion, name }: TValueSetExpansionProps) => {
  if (!expansion) {
    return null;
  }
  const values = Array.isArray(expansion) ? expansion : [expansion];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.identifier && <Typography component="div"><b>Identifier:</b>&nbsp;{String(value.identifier)}</Typography>}
          <Typography component="div"><b>Timestamp:</b>&nbsp;{String(value.timestamp)}</Typography>
          {value.total !== undefined && <Typography component="div"><b>Total:</b>&nbsp;{String(value.total)}</Typography>}
          {value.offset !== undefined && <Typography component="div"><b>Offset:</b>&nbsp;{String(value.offset)}</Typography>}
          {value.contains && value.contains.length > 0 && (
            <Box sx={{ ml: 2 }}>
              {value.contains.filter((c) => c).slice(0, 20).map((entry, cIndex) => (
                <Typography component="div" key={cIndex}>
                  <b>Contains:</b>&nbsp;{entry.display || entry.code}
                  {entry.system && ` (${entry.system})`}
                </Typography>
              ))}
              {value.contains.length > 20 && (
                <Typography component="div">…and {value.contains.length - 20} more</Typography>
              )}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ValueSetExpansion;
