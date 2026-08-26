import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMedicationRequestDispenseRequest } from '../types/partials/MedicationRequestDispenseRequest';
import Quantity from './Quantity';
import Period from './Period';
import Reference from './Reference';
import UnsignedInt from './UnsignedInt';

type TMedicationRequestDispenseRequestProps = TBaseResourceProps & {
  field?: string;
  dispenseRequest: TMedicationRequestDispenseRequest | TMedicationRequestDispenseRequest[] | undefined;
};

const MedicationRequestDispenseRequestField = ({
  dispenseRequest,
  name,
  resourceType,
}: TMedicationRequestDispenseRequestProps) => {
  if (!dispenseRequest) {
    return null;
  }
  const values = Array.isArray(dispenseRequest) ? dispenseRequest : [dispenseRequest];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <UnsignedInt unsignedInt={value.numberOfRepeatsAllowed} name="Number Of Repeats Allowed" resourceType={resourceType} />
          <Quantity quantity={value.quantity} name="Quantity" resourceType={resourceType} />
          <Quantity quantity={value.dispenseInterval} name="Dispense Interval" resourceType={resourceType} />
          <Quantity quantity={value.expectedSupplyDuration} name="Expected Supply Duration" resourceType={resourceType} />
          <Period period={value.validityPeriod} name="Validity Period" resourceType={resourceType} />
          <Reference reference={value.performer} name="Performer" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default MedicationRequestDispenseRequestField;
