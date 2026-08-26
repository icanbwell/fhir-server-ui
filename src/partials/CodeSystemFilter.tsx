import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCodeSystemFilter } from '../types/partials/CodeSystemFilter';

type TCodeSystemFilterProps = TBaseResourceProps & {
  field?: string;
  filter: TCodeSystemFilter | TCodeSystemFilter[] | undefined;
};

const CodeSystemFilter = ({ filter, name }: TCodeSystemFilterProps) => {
  if (!filter) {
    return null;
  }
  const values = Array.isArray(filter) ? filter : [filter];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Code:</b>&nbsp;{`${value.code}`}</Typography>
          {value.operator && (
            <Typography component="div">
              <b>Operator:</b>&nbsp;{(Array.isArray(value.operator) ? value.operator : [value.operator]).join(', ')}
            </Typography>
          )}
          <Typography component="div"><b>Value:</b>&nbsp;{`${value.value}`}</Typography>
          {value.description && (
            <Typography component="div"><b>Description:</b>&nbsp;{`${value.description}`}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CodeSystemFilter;
