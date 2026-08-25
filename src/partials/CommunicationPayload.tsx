import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCommunicationPayload } from '../types/partials/CommunicationPayload';
import Attachment from './Attachment';
import Reference from './Reference';

type TCommunicationPayloadProps = TBaseResourceProps & {
  field?: string;
  payload: TCommunicationPayload | TCommunicationPayload[] | undefined;
};

const CommunicationPayload = ({ payload, name, resourceType, id }: TCommunicationPayloadProps) => {
  if (!payload) {
    return null;
  }
  const values = Array.isArray(payload) ? payload : [payload];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.contentString && (
            <Typography component="div"><b>Content:</b>&nbsp;{value.contentString}</Typography>
          )}
          <Attachment attachment={value.contentAttachment} name="Content Attachment" resourceType={resourceType} id={id} />
          <Reference reference={value.contentReference} name="Content Reference" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default CommunicationPayload;
