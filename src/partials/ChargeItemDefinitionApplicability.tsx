import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TChargeItemDefinitionApplicability } from '../types/partials/ChargeItemDefinitionApplicability';

type TChargeItemDefinitionApplicabilityProps = TBaseResourceProps & {
  field?: string;
  applicability: TChargeItemDefinitionApplicability | TChargeItemDefinitionApplicability[] | undefined;
};

const ChargeItemDefinitionApplicability = ({ applicability, name }: TChargeItemDefinitionApplicabilityProps) => {
  if (!applicability) {
    return null;
  }
  const values = Array.isArray(applicability) ? applicability : [applicability];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.description && (
            <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>
          )}
          {value.language && (
            <Typography component="div"><b>Language:</b>&nbsp;{value.language}</Typography>
          )}
          {value.expression && (
            <Typography component="div"><b>Expression:</b>&nbsp;{value.expression}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ChargeItemDefinitionApplicability;
