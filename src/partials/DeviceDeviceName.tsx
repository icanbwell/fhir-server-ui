import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDeviceDeviceName } from '../types/partials/DeviceDeviceName';

type TDeviceDeviceNameProps = TBaseResourceProps & {
  field?: string;
  deviceName: TDeviceDeviceName | TDeviceDeviceName[] | undefined;
};

const DeviceDeviceName = ({ deviceName, name }: TDeviceDeviceNameProps) => {
  if (!deviceName) {
    return null;
  }
  const values = Array.isArray(deviceName) ? deviceName : [deviceName];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          {value.type && <Typography component="div"><b>Type:</b>&nbsp;{value.type}</Typography>}
        </Box>
      ))}
    </Box>
  );
};

export default DeviceDeviceName;
