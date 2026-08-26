import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TObservationComponent } from '../types/partials/ObservationComponent';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Range from './Range';
import Ratio from './Ratio';
import Period from './Period';
import ObservationReferenceRange from './ObservationReferenceRange';

type TObservationComponentProps = TBaseResourceProps & {
  field?: string;
  component: TObservationComponent | TObservationComponent[] | undefined;
};

const ObservationComponentField = ({ component, name, resourceType }: TObservationComponentProps) => {
  if (!component) {
    return null;
  }
  const values = Array.isArray(component) ? component : [component];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.code} name="Code" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.valueCodeableConcept} name="Value" resourceType={resourceType} />
          <Quantity quantity={value.valueQuantity} name="Value" resourceType={resourceType} />
          <Range range={value.valueRange} name="Value" resourceType={resourceType} />
          <Ratio ratio={value.valueRatio} name="Value" resourceType={resourceType} />
          <Period period={value.valuePeriod} name="Value Period" resourceType={resourceType} />
          {value.valueString && (
            <Typography component="div"><b>Value:</b>&nbsp;{`${value.valueString}`}</Typography>
          )}
          {value.valueBoolean !== undefined && (
            <Typography component="div"><b>Value:</b>&nbsp;{value.valueBoolean ? 'True' : 'False'}</Typography>
          )}
          {value.valueInteger !== undefined && (
            <Typography component="div"><b>Value:</b>&nbsp;{`${value.valueInteger}`}</Typography>
          )}
          {value.valueDateTime && (
            <Typography component="div"><b>Value Date/Time:</b>&nbsp;{`${value.valueDateTime}`}</Typography>
          )}
          <CodeableConcept codeableConcept={value.dataAbsentReason} name="Data Absent Reason" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.interpretation} name="Interpretation" resourceType={resourceType} />
          <ObservationReferenceRange
            observationReferenceRange={value.referenceRange}
            name="Reference Range"
            resourceType={resourceType}
          />
        </Box>
      ))}
    </Box>
  );
};

export default ObservationComponentField;
