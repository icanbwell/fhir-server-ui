import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TExplanationOfBenefitAdjudication } from '../types/partials/ExplanationOfBenefitAdjudication';
import CodeableConcept from './CodeableConcept';
import Money from './Money';

type TExplanationOfBenefitAdjudicationProps = TBaseResourceProps & {
  field?: string;
  adjudication: TExplanationOfBenefitAdjudication | TExplanationOfBenefitAdjudication[] | undefined;
};

const ExplanationOfBenefitAdjudication = ({ adjudication, name, resourceType }: TExplanationOfBenefitAdjudicationProps) => {
  if (!adjudication) {
    return null;
  }
  const values = Array.isArray(adjudication) ? adjudication : [adjudication];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.category} name="Category" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.reason} name="Reason" resourceType={resourceType} />
          <Money money={value.amount} name="Amount" resourceType={resourceType} />
          {value.value !== undefined && value.value !== null && (
            <Typography component="div"><b>Value:</b>&nbsp;{`${value.value}`}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default ExplanationOfBenefitAdjudication;
