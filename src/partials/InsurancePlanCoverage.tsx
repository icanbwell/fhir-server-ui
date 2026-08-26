import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TInsurancePlanCoverage } from '../types/partials/InsurancePlanCoverage';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TInsurancePlanCoverageProps = TBaseResourceProps & {
  field?: string;
  coverage: TInsurancePlanCoverage | TInsurancePlanCoverage[] | undefined;
};

const InsurancePlanCoverageField = ({ coverage, name, resourceType }: TInsurancePlanCoverageProps) => {
  if (!coverage) {
    return null;
  }
  const values = Array.isArray(coverage) ? coverage : [coverage];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <Reference reference={value.network} name="Network" resourceType={resourceType} />
          {value.benefit && value.benefit.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography component="div"><b>Benefits:</b></Typography>
              {value.benefit.map((b, bIndex) => (
                <Box key={bIndex} sx={{ pl: 2 }}>
                  <CodeableConcept codeableConcept={b.type} name="Type" resourceType={resourceType} />
                  {b.requirement && (
                    <Typography component="div"><b>Requirement:</b>&nbsp;{b.requirement}</Typography>
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

export default InsurancePlanCoverageField;
