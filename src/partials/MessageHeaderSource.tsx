import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMessageHeaderSource } from '../types/partials/MessageHeaderSource';
import ContactPoint from './ContactPoint';
import Url from './Url';

type TMessageHeaderSourceProps = TBaseResourceProps & {
  field?: string;
  source: TMessageHeaderSource | TMessageHeaderSource[] | undefined;
};

const MessageHeaderSourceField = ({ source, name, resourceType }: TMessageHeaderSourceProps) => {
  if (!source) {
    return null;
  }
  const values = Array.isArray(source) ? source : [source];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          {value.software && <Typography component="div"><b>Software:</b>&nbsp;{value.software}</Typography>}
          {value.version && <Typography component="div"><b>Version:</b>&nbsp;{value.version}</Typography>}
          <Url url={value.endpoint} name="Endpoint" resourceType={resourceType} />
          <ContactPoint contactPoint={value.contact} name="Contact" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default MessageHeaderSourceField;
