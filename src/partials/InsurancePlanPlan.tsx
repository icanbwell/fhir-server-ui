import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TInsurancePlanPlan } from '../types/partials/InsurancePlanPlan';
import Identifier from './Identifier';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';
import Money from './Money';

type TInsurancePlanPlanProps = TBaseResourceProps & {
  field?: string;
  plan: TInsurancePlanPlan | TInsurancePlanPlan[] | undefined;
};

const InsurancePlanPlanField = ({ plan, name, resourceType }: TInsurancePlanPlanProps) => {
  if (!plan) {
    return null;
  }
  const values = Array.isArray(plan) ? plan : [plan];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Identifier identifier={value.identifier} name="Identifier" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <Reference reference={value.coverageArea} name="Coverage Area" resourceType={resourceType} />
          <Reference reference={value.network} name="Network" resourceType={resourceType} />
          {value.generalCost && value.generalCost.length > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography component="div"><b>General Cost:</b></Typography>
              {value.generalCost.map((gc, gcIndex) => (
                <Box key={gcIndex} sx={{ pl: 2 }}>
                  <CodeableConcept codeableConcept={gc.type} name="Type" resourceType={resourceType} />
                  {gc.groupSize !== undefined && (
                    <Typography component="div"><b>Group Size:</b>&nbsp;{`${gc.groupSize}`}</Typography>
                  )}
                  <Money money={gc.cost} name="Cost" resourceType={resourceType} />
                  {gc.comment && <Typography component="div"><b>Comment:</b>&nbsp;{gc.comment}</Typography>}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default InsurancePlanPlanField;
