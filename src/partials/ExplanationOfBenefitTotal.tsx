import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TExplanationOfBenefitTotal } from '../types/partials/ExplanationOfBenefitTotal';
import CodeableConcept from './CodeableConcept';
import Money from './Money';

type TExplanationOfBenefitTotalProps = TBaseResourceProps & {
  field?: string;
  total: TExplanationOfBenefitTotal | TExplanationOfBenefitTotal[] | undefined;
};

const ExplanationOfBenefitTotal = ({ total, name, resourceType }: TExplanationOfBenefitTotalProps) => {
  if (!total) {
    return null;
  }
  const values = Array.isArray(total) ? total : [total];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.category} name="Category" resourceType={resourceType} />
          <Money money={value.amount} name="Amount" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ExplanationOfBenefitTotal;
