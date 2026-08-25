import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TExplanationOfBenefitItem } from '../types/partials/ExplanationOfBenefitItem';
import CodeableConcept from './CodeableConcept';
import Period from './Period';
import Quantity from './Quantity';
import Money from './Money';
import ExplanationOfBenefitAdjudication from './ExplanationOfBenefitAdjudication';

type TExplanationOfBenefitItemProps = TBaseResourceProps & {
  field?: string;
  item: TExplanationOfBenefitItem | TExplanationOfBenefitItem[] | undefined;
};

const ExplanationOfBenefitItem = ({ item, name, resourceType }: TExplanationOfBenefitItemProps) => {
  if (!item) {
    return null;
  }
  const values = Array.isArray(item) ? item : [item];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>Sequence:</b>&nbsp;{`${value.sequence}`}</Typography>
          <CodeableConcept codeableConcept={value.category} name="Category" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.productOrService} name="Product Or Service" resourceType={resourceType} />
          {value.servicedDate && <Typography component="div"><b>Serviced Date:</b>&nbsp;{`${value.servicedDate}`}</Typography>}
          <Period period={value.servicedPeriod} name="Serviced Period" resourceType={resourceType} />
          <Quantity quantity={value.quantity} name="Quantity" resourceType={resourceType} />
          <Money money={value.unitPrice} name="Unit Price" resourceType={resourceType} />
          <Money money={value.net} name="Net" resourceType={resourceType} />
          <ExplanationOfBenefitAdjudication adjudication={value.adjudication} name="Adjudication" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ExplanationOfBenefitItem;
