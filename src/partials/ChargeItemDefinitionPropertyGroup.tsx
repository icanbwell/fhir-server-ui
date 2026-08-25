import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TChargeItemDefinitionPropertyGroup } from '../types/partials/ChargeItemDefinitionPropertyGroup';
import CodeableConcept from './CodeableConcept';
import Money from './Money';

type TChargeItemDefinitionPropertyGroupProps = TBaseResourceProps & {
  field?: string;
  propertyGroup: TChargeItemDefinitionPropertyGroup | TChargeItemDefinitionPropertyGroup[] | undefined;
};

const ChargeItemDefinitionPropertyGroup = ({ propertyGroup, name, resourceType }: TChargeItemDefinitionPropertyGroupProps) => {
  if (!propertyGroup) {
    return null;
  }
  const values = Array.isArray(propertyGroup) ? propertyGroup : [propertyGroup];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.applicability?.map((applicability, applicabilityIndex) => (
            <Box key={applicabilityIndex}>
              {applicability.description && (
                <Typography component="div"><b>Applicability:</b>&nbsp;{applicability.description}</Typography>
              )}
            </Box>
          ))}
          {value.priceComponent?.map((priceComponent, priceComponentIndex) => (
            <Box key={priceComponentIndex} sx={{ ml: 2, mb: 1 }}>
              {priceComponent.type && (
                <Typography component="div"><b>Price Component Type:</b>&nbsp;{priceComponent.type}</Typography>
              )}
              <CodeableConcept codeableConcept={priceComponent.code} name="Price Component Code" resourceType={resourceType} />
              {priceComponent.factor !== undefined && priceComponent.factor !== null && (
                <Typography component="div"><b>Factor:</b>&nbsp;{`${priceComponent.factor}`}</Typography>
              )}
              <Money money={priceComponent.amount} name="Amount" resourceType={resourceType} />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default ChargeItemDefinitionPropertyGroup;
