import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TAuditEventEntity } from '../types/partials/AuditEventEntity';
import Reference from './Reference';
import Coding from './Coding';

type TAuditEventEntityProps = TBaseResourceProps & {
  field?: string;
  entity: TAuditEventEntity | TAuditEventEntity[] | undefined;
};

const AuditEventEntity = ({ entity, name, resourceType }: TAuditEventEntityProps) => {
  if (!entity) {
    return null;
  }
  const values = Array.isArray(entity) ? entity : [entity];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Reference reference={value.what} name="What" resourceType={resourceType} />
          <Coding coding={value.type} name="Type" resourceType={resourceType} />
          <Coding coding={value.role} name="Role" resourceType={resourceType} />
          <Coding coding={value.lifecycle} name="Lifecycle" resourceType={resourceType} />
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default AuditEventEntity;
