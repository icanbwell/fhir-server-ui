import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMarketingStatus } from '../types/partials/MarketingStatus';
import CodeableConcept from './CodeableConcept';
import Period from './Period';

type TMarketingStatusProps = TBaseResourceProps & {
  marketingStatus: TMarketingStatus | TMarketingStatus[] | undefined;
};

const MarketingStatusField = ({ marketingStatus, name, resourceType }: TMarketingStatusProps) => {
  if (!marketingStatus) {
    return null;
  }
  const values = Array.isArray(marketingStatus) ? marketingStatus : [marketingStatus];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index}>
          <CodeableConcept codeableConcept={value.country} name="Country" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.jurisdiction} name="Jurisdiction" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.status} name="Status" resourceType={resourceType} />
          <Period period={value.dateRange} name="Date Range" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default MarketingStatusField;
