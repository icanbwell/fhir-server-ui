import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDeviceMetricCalibration } from '../types/partials/DeviceMetricCalibration';
import Instant from './Instant';

type TDeviceMetricCalibrationProps = TBaseResourceProps & {
  field?: string;
  calibration: TDeviceMetricCalibration | TDeviceMetricCalibration[] | undefined;
};

const DeviceMetricCalibration = ({ calibration, name, resourceType }: TDeviceMetricCalibrationProps) => {
  if (!calibration) {
    return null;
  }
  const values = Array.isArray(calibration) ? calibration : [calibration];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.type && <Typography component="div"><b>Type:</b>&nbsp;{value.type}</Typography>}
          {value.state && <Typography component="div"><b>State:</b>&nbsp;{value.state}</Typography>}
          <Instant instant={value.time} name="Time" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default DeviceMetricCalibration;
