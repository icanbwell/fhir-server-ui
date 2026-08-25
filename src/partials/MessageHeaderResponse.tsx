import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMessageHeaderResponse } from '../types/partials/MessageHeaderResponse';
import Reference from './Reference';

type TMessageHeaderResponseProps = TBaseResourceProps & {
  field?: string;
  response: TMessageHeaderResponse | TMessageHeaderResponse[] | undefined;
};

const MessageHeaderResponseField = ({ response, name, resourceType }: TMessageHeaderResponseProps) => {
  if (!response) {
    return null;
  }
  const values = Array.isArray(response) ? response : [response];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.identifier && (
            <Typography component="div"><b>Identifier:</b>&nbsp;{`${value.identifier}`}</Typography>
          )}
          {value.code && (
            <Typography component="div"><b>Code:</b>&nbsp;{`${value.code}`}</Typography>
          )}
          <Reference reference={value.details} name="Details" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default MessageHeaderResponseField;
