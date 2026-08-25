import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TProdCharacteristic } from '../types/partials/ProdCharacteristic';
import Quantity from './Quantity';

type TProdCharacteristicProps = TBaseResourceProps & {
  prodCharacteristic: TProdCharacteristic | TProdCharacteristic[] | undefined;
};

const ProdCharacteristicField = ({ prodCharacteristic, name, resourceType }: TProdCharacteristicProps) => {
  if (!prodCharacteristic) {
    return null;
  }
  const values = Array.isArray(prodCharacteristic) ? prodCharacteristic : [prodCharacteristic];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index}>
          <Quantity quantity={value.height} name="Height" resourceType={resourceType} />
          <Quantity quantity={value.width} name="Width" resourceType={resourceType} />
          <Quantity quantity={value.depth} name="Depth" resourceType={resourceType} />
          <Quantity quantity={value.weight} name="Weight" resourceType={resourceType} />
          <Quantity quantity={value.nominalVolume} name="Nominal Volume" resourceType={resourceType} />
          <Quantity quantity={value.externalDiameter} name="External Diameter" resourceType={resourceType} />
          {value.shape && <Typography component="div"><b>Shape:</b>&nbsp;{value.shape}</Typography>}
          {value.color && value.color.length > 0 && (
            <Typography component="div"><b>Color:</b>&nbsp;{value.color.join(', ')}</Typography>
          )}
          {value.imprint && value.imprint.length > 0 && (
            <Typography component="div"><b>Imprint:</b>&nbsp;{value.imprint.join(', ')}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ProdCharacteristicField;
