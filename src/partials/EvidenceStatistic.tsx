import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TEvidenceStatistic } from '../types/partials/EvidenceStatistic';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Annotation from './Annotation';

type TEvidenceStatisticProps = TBaseResourceProps & {
  field?: string;
  statistic: TEvidenceStatistic | TEvidenceStatistic[] | undefined;
};

const EvidenceStatistic = ({ statistic, name, resourceType }: TEvidenceStatisticProps) => {
  if (!statistic) {
    return null;
  }
  const values = Array.isArray(statistic) ? statistic : [statistic];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
          <CodeableConcept codeableConcept={value.statisticType} name="Statistic Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.category} name="Category" resourceType={resourceType} />
          <Quantity quantity={value.quantity} name="Quantity" resourceType={resourceType} />
          {value.numberOfEvents !== undefined && (
            <Typography component="div"><b>Number of Events:</b>&nbsp;{`${value.numberOfEvents}`}</Typography>
          )}
          {value.numberAffected !== undefined && (
            <Typography component="div"><b>Number Affected:</b>&nbsp;{`${value.numberAffected}`}</Typography>
          )}
          <Annotation annotation={value.note} name="Notes" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default EvidenceStatistic;
