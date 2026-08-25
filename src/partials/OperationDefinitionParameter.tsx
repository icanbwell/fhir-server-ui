import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TOperationDefinitionParameter } from '../types/partials/OperationDefinitionParameter';

type TOperationDefinitionParameterProps = TBaseResourceProps & {
  field?: string;
  parameter: TOperationDefinitionParameter | TOperationDefinitionParameter[] | undefined;
};

const OperationDefinitionParameterField = ({ parameter, name }: TOperationDefinitionParameterProps) => {
  if (!parameter) {
    return null;
  }
  const values = Array.isArray(parameter) ? parameter : [parameter];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Name:</b>&nbsp;{`${value.name}`}</Typography>
          <Typography component="div"><b>Use:</b>&nbsp;{`${value.use}`}</Typography>
          <Typography component="div"><b>Min:</b>&nbsp;{`${value.min}`}</Typography>
          <Typography component="div"><b>Max:</b>&nbsp;{`${value.max}`}</Typography>
          {value.type && (
            <Typography component="div"><b>Type:</b>&nbsp;{`${value.type}`}</Typography>
          )}
          {value.documentation && (
            <Typography component="div"><b>Documentation:</b>&nbsp;{`${value.documentation}`}</Typography>
          )}
          {value.searchType && (
            <Typography component="div"><b>Search Type:</b>&nbsp;{`${value.searchType}`}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default OperationDefinitionParameterField;
