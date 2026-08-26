import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TClaimResponseItem } from '../types/partials/ClaimResponseItem';
import CodeableConcept from './CodeableConcept';
import Money from './Money';

type TClaimResponseItemProps = TBaseResourceProps & {
  field?: string;
  item: TClaimResponseItem | TClaimResponseItem[] | undefined;
};

const ClaimResponseItem = ({ item, name, resourceType }: TClaimResponseItemProps) => {
  if (!item) {
    return null;
  }
  const values = Array.isArray(item) ? item : [item];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.itemSequence !== undefined && value.itemSequence !== null && (
            <Typography component="div"><b>Item Sequence:</b>&nbsp;{`${value.itemSequence}`}</Typography>
          )}
          {value.adjudication?.map((adjudication, adjudicationIndex) => (
            <Box key={adjudicationIndex} sx={{ ml: 2, mb: 1 }}>
              <CodeableConcept codeableConcept={adjudication.category} name="Adjudication Category" resourceType={resourceType} />
              <CodeableConcept codeableConcept={adjudication.reason} name="Adjudication Reason" resourceType={resourceType} />
              <Money money={adjudication.amount} name="Adjudication Amount" resourceType={resourceType} />
              {adjudication.value !== undefined && adjudication.value !== null && (
                <Typography component="div"><b>Adjudication Value:</b>&nbsp;{`${adjudication.value}`}</Typography>
              )}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

export default ClaimResponseItem;
