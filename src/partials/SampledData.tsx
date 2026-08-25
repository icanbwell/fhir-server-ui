import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TSampledData } from '../types/partials/SampledData';
import Quantity from './Quantity';

type TSampledDataProps = TBaseResourceProps & {
  sampledData: TSampledData | undefined;
};

// Renders the waveform envelope (origin/period/limits/dimensions), not the raw `data` string —
// that's a space-delimited series of potentially thousands of decimal values, better left to a
// dedicated chart/export view than a resource detail page.
const SampledDataField = ({ sampledData, name, resourceType }: TSampledDataProps) => {
  if (!sampledData) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      <Quantity quantity={sampledData.origin} name="Origin" resourceType={resourceType} />
      <Typography component="div"><b>Period:</b>&nbsp;{`${sampledData.period}`}</Typography>
      {sampledData.factor !== undefined && (
        <Typography component="div"><b>Factor:</b>&nbsp;{`${sampledData.factor}`}</Typography>
      )}
      {sampledData.lowerLimit !== undefined && (
        <Typography component="div"><b>Lower Limit:</b>&nbsp;{`${sampledData.lowerLimit}`}</Typography>
      )}
      {sampledData.upperLimit !== undefined && (
        <Typography component="div"><b>Upper Limit:</b>&nbsp;{`${sampledData.upperLimit}`}</Typography>
      )}
      <Typography component="div"><b>Dimensions:</b>&nbsp;{`${sampledData.dimensions}`}</Typography>
    </Box>
  );
};

export default SampledDataField;
