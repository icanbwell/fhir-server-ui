import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TAuditEventAgent } from '../types/partials/AuditEventAgent';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Coding from './Coding';
import BooleanField from './Boolean';

type TAuditEventAgentProps = TBaseResourceProps & {
  field?: string;
  agent: TAuditEventAgent | TAuditEventAgent[] | undefined;
};

const AuditEventAgent = ({ agent, name, resourceType }: TAuditEventAgentProps) => {
  if (!agent) {
    return null;
  }
  const values = Array.isArray(agent) ? agent : [agent];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          <Reference reference={value.who} name="Who" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.role} name="Role" resourceType={resourceType} />
          <BooleanField boolean={value.requestor} name="Requestor" resourceType={resourceType} />
          <Reference reference={value.location} name="Location" resourceType={resourceType} />
          <Coding coding={value.media} name="Media" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.purposeOfUse} name="Purpose Of Use" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default AuditEventAgent;
