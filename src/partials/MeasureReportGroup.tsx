import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMeasureReportGroup } from '../types/partials/MeasureReportGroup';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Reference from './Reference';
import Int from './Int';

type TMeasureReportGroupProps = TBaseResourceProps & {
  field?: string;
  group: TMeasureReportGroup | TMeasureReportGroup[] | undefined;
};

const MeasureReportGroupField = ({ group, name, resourceType }: TMeasureReportGroupProps) => {
  if (!group) {
    return null;
  }
  const values = Array.isArray(group) ? group : [group];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <Quantity quantity={value.measureScore} name="Measure Score" resourceType={resourceType} />
          {value.population && value.population.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography component="div"><b>Population:</b></Typography>
              {value.population.map((pop, popIndex) => (
                <Box key={popIndex} sx={{ ml: 2, mb: 1 }}>
                  <CodeableConcept codeableConcept={pop.code} name="Population Code" resourceType={resourceType} />
                  <Int int={pop.count} name="Count" resourceType={resourceType} />
                  <Reference reference={pop.subjectResults} name="Subject Results" resourceType={resourceType} />
                </Box>
              ))}
            </Box>
          )}
          {value.stratifier && value.stratifier.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography component="div"><b>Stratifier:</b></Typography>
              {value.stratifier.map((stratifier, stratIndex) => (
                <Box key={stratIndex} sx={{ ml: 2, mb: 1 }}>
                  <CodeableConcept codeableConcept={stratifier.code} name="Stratifier Code" resourceType={resourceType} />
                  {stratifier.stratum && (
                    <Typography component="div"><b>Stratum Count:</b>&nbsp;{stratifier.stratum.length}</Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default MeasureReportGroupField;
