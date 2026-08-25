import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDeviceUdiCarrier } from '../types/partials/DeviceUdiCarrier';
import Uri from './Uri';
import StringField from './String';

type TDeviceUdiCarrierProps = TBaseResourceProps & {
  field?: string;
  udiCarrier: TDeviceUdiCarrier | TDeviceUdiCarrier[] | undefined;
};

const DeviceUdiCarrier = ({ udiCarrier, name, resourceType }: TDeviceUdiCarrierProps) => {
  if (!udiCarrier) {
    return null;
  }
  const values = Array.isArray(udiCarrier) ? udiCarrier : [udiCarrier];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <StringField string={value.deviceIdentifier} name="Device Identifier" resourceType={resourceType} />
          <Uri uri={value.issuer} name="Issuer" resourceType={resourceType} />
          <Uri uri={value.jurisdiction} name="Jurisdiction" resourceType={resourceType} />
          <StringField string={value.carrierHRF} name="Carrier HRF" resourceType={resourceType} />
          <StringField string={value.entryType} name="Entry Type" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default DeviceUdiCarrier;
