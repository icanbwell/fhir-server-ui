import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMessageDefinitionFocus } from '../types/partials/MessageDefinitionFocus';
import Canonical from './Canonical';
import UnsignedInt from './UnsignedInt';

type TMessageDefinitionFocusProps = TBaseResourceProps & {
  field?: string;
  focus: TMessageDefinitionFocus | TMessageDefinitionFocus[] | undefined;
};

const MessageDefinitionFocusField = ({ focus, name, resourceType }: TMessageDefinitionFocusProps) => {
  if (!focus) {
    return null;
  }
  const values = Array.isArray(focus) ? focus : [focus];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          {value.code && <Typography component="div"><b>Code:</b>&nbsp;{value.code}</Typography>}
          <Canonical canonical={value.profile} name="Profile" resourceType={resourceType} />
          <UnsignedInt unsignedInt={value.min} name="Min" resourceType={resourceType} />
          {value.max && <Typography component="div"><b>Max:</b>&nbsp;{value.max}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default MessageDefinitionFocusField;
