import {
  Typography,
  Box,
} from '@mui/material';
import CodeableConcept from './CodeableConcept';
import { TBaseResourceProps } from '../types/baseTypes';
import { TTiming } from '../types/partials/Timing';

type TTimingProps = TBaseResourceProps & {
  timing: TTiming|TTiming[]|undefined;
};

function Timing({ timing = [], name }: TTimingProps) {
  // Convert timing to array if it's not
  const timingArray = Array.isArray(timing) ? timing : [timing];

  return (
    <>
      {timingArray.length > 0 && timingArray[0] && timingArray[0].code && (
          <Box>
            <Typography variant="h4">{name}</Typography>
            {timingArray.map((t: TTiming, index: Number) => (
              <CodeableConcept
                key={`${index}`}
                resourceType=""
                codeableConcept={t.code}
                name="Timing Code"
                searchParameter=""
              />
            ))}
          </Box>
        )}
    </>
  );
}

export default Timing;
