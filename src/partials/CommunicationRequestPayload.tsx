import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TCommunicationRequestPayload } from '../types/partials/CommunicationRequestPayload';
import Attachment from './Attachment';
import Reference from './Reference';

type TCommunicationRequestPayloadProps = TBaseResourceProps & {
  field?: string;
  payload: TCommunicationRequestPayload | TCommunicationRequestPayload[] | undefined;
};

const CommunicationRequestPayload = ({ payload, name, resourceType, id }: TCommunicationRequestPayloadProps) => {
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

export default CommunicationRequestPayload;
