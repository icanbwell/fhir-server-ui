import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMessageHeaderDestination } from '../types/partials/MessageHeaderDestination';
import Reference from './Reference';
import Url from './Url';

type TMessageHeaderDestinationProps = TBaseResourceProps & {
  field?: string;
  destination: TMessageHeaderDestination | TMessageHeaderDestination[] | undefined;
};

const MessageHeaderDestinationField = ({ destination, name, resourceType }: TMessageHeaderDestinationProps) => {
  if (!destination) {
    return null;
  }
  const values = Array.isArray(destination) ? destination : [destination];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          <Url url={value.endpoint} name="Endpoint" resourceType={resourceType} />
          <Reference reference={value.target} name="Target" resourceType={resourceType} />
          <Reference reference={value.receiver} name="Receiver" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default MessageHeaderDestinationField;
