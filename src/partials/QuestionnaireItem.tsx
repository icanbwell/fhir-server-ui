import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TQuestionnaireItem } from '../types/partials/QuestionnaireItem';
import Coding from './Coding';

type TQuestionnaireItemProps = TBaseResourceProps & {
  field?: string;
  item: TQuestionnaireItem | TQuestionnaireItem[] | undefined;
};

const QuestionnaireItemField = ({ item, name, resourceType }: TQuestionnaireItemProps) => {
  if (!item) {
    return null;
  }
  const values = Array.isArray(item) ? item : [item];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.linkId && <Typography component="div"><b>Link Id:</b>&nbsp;{value.linkId}</Typography>}
          {value.text && <Typography component="div"><b>Text:</b>&nbsp;{value.text}</Typography>}
          {value.type && <Typography component="div"><b>Type:</b>&nbsp;{value.type}</Typography>}
          {value.required !== undefined && (
            <Typography component="div"><b>Required:</b>&nbsp;{value.required ? 'True' : 'False'}</Typography>
          )}
          {value.repeats !== undefined && (
            <Typography component="div"><b>Repeats:</b>&nbsp;{value.repeats ? 'True' : 'False'}</Typography>
          )}
          <Coding coding={value.code} name="Code" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default QuestionnaireItemField;
