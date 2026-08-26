import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TExplanationOfBenefitBenefitBalance } from '../types/partials/ExplanationOfBenefitBenefitBalance';
import CodeableConcept from './CodeableConcept';

type TExplanationOfBenefitBenefitBalanceProps = TBaseResourceProps & {
  field?: string;
  benefitBalance: TExplanationOfBenefitBenefitBalance | TExplanationOfBenefitBenefitBalance[] | undefined;
};

const ExplanationOfBenefitBenefitBalance = ({ benefitBalance, name, resourceType }: TExplanationOfBenefitBenefitBalanceProps) => {
  if (!benefitBalance) {
    return null;
  }
  const values = Array.isArray(benefitBalance) ? benefitBalance : [benefitBalance];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.category} name="Category" resourceType={resourceType} />
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{`${value.name}`}</Typography>}
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{`${value.description}`}</Typography>}
          {value.excluded !== undefined && value.excluded !== null && (
            <Typography component="div"><b>Excluded:</b>&nbsp;{value.excluded ? 'True' : 'False'}</Typography>
          )}
          <CodeableConcept codeableConcept={value.network} name="Network" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.unit} name="Unit" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.term} name="Term" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ExplanationOfBenefitBenefitBalance;
