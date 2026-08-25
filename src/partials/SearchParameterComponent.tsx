import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TSearchParameterComponent } from '../types/partials/SearchParameterComponent';

type TSearchParameterComponentProps = TBaseResourceProps & {
  field?: string;
  component: TSearchParameterComponent | TSearchParameterComponent[] | undefined;
};

const SearchParameterComponentField = ({ component, name }: TSearchParameterComponentProps) => {
  if (!component) {
    return null;
  }
  const values = Array.isArray(component) ? component : [component];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.definition && <Typography component="div"><b>Definition:</b>&nbsp;{value.definition}</Typography>}
          {value.expression && <Typography component="div"><b>Expression:</b>&nbsp;{value.expression}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default SearchParameterComponentField;
