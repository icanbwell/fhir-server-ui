import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDeviceDefinitionUdiDeviceIdentifier } from '../types/partials/DeviceDefinitionUdiDeviceIdentifier';
import Uri from './Uri';

type TDeviceDefinitionUdiDeviceIdentifierProps = TBaseResourceProps & {
  field?: string;
  udiDeviceIdentifier: TDeviceDefinitionUdiDeviceIdentifier | TDeviceDefinitionUdiDeviceIdentifier[] | undefined;
};

const DeviceDefinitionUdiDeviceIdentifier = ({ udiDeviceIdentifier, name, resourceType }: TDeviceDefinitionUdiDeviceIdentifierProps) => {
  if (!udiDeviceIdentifier) {
    return null;
  }
  const values = Array.isArray(udiDeviceIdentifier) ? udiDeviceIdentifier : [udiDeviceIdentifier];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.deviceIdentifier && (
            <Typography component="div"><b>Device Identifier:</b>&nbsp;{value.deviceIdentifier}</Typography>
          )}
          <Uri uri={value.issuer} name="Issuer" resourceType={resourceType} />
          <Uri uri={value.jurisdiction} name="Jurisdiction" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default DeviceDefinitionUdiDeviceIdentifier;
