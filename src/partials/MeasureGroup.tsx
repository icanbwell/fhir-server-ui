import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMeasureGroup } from '../types/partials/MeasureGroup';
import CodeableConcept from './CodeableConcept';

type TMeasureGroupProps = TBaseResourceProps & {
  field?: string;
  group: TMeasureGroup | TMeasureGroup[] | undefined;
};

const MeasureGroupField = ({ group, name, resourceType }: TMeasureGroupProps) => {
  if (!group) {
    return null;
  }
  const values = Array.isArray(group) ? group : [group];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
          {value.population && value.population.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography component="div"><b>Population:</b></Typography>
              {value.population.map((p, pIndex) => (
                <Box key={pIndex} sx={{ pl: 2 }}>
                  <CodeableConcept codeableConcept={p.code} name="Code" resourceType={resourceType} />
                  {p.description && <Typography component="div"><b>Description:</b>&nbsp;{p.description}</Typography>}
                  {p.criteria?.expression && (
                    <Typography component="div"><b>Criteria:</b>&nbsp;{p.criteria.expression}</Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}
          {value.stratifier && value.stratifier.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography component="div"><b>Stratifier:</b></Typography>
              {value.stratifier.map((s, sIndex) => (
                <Box key={sIndex} sx={{ pl: 2 }}>
                  <CodeableConcept codeableConcept={s.code} name="Code" resourceType={resourceType} />
                  {s.description && <Typography component="div"><b>Description:</b>&nbsp;{s.description}</Typography>}
                  {s.criteria?.expression && (
                    <Typography component="div"><b>Criteria:</b>&nbsp;{s.criteria.expression}</Typography>
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

export default MeasureGroupField;
