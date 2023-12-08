import { Typography, Box } from '@mui/material';
import NameValue from './NameValue';
import CodeableConcept from './CodeableConcept';
import Timing from './Timing';
import { TBaseResourceProps } from '../types/baseTypes';
import { TDosage } from '../types/partials/Dosage';

type TDosageProps = TBaseResourceProps & {
  dosage: TDosage[]|undefined;
};

const Dosage = ({ dosage: dosages, name }: TDosageProps) => {
  return (
    <>
      {dosages && dosages.length > 0 && dosages[0] && (
        <Box>
          <Typography variant="h4">{name}</Typography>
          {dosages.map((dosage, index) => (
            <Box key={index}>
              <Typography variant="h5">
                Sequence {`${dosage.sequence}` || ''}
              </Typography>
              <NameValue value={dosage.text} name="Text" />
              <CodeableConcept
                resourceType=""
                codeableConcept={dosage.additionalInstruction}
                name="Additional Instruction"
                searchParameter=""
              />
              <NameValue
                value={dosage.patientInstruction}
                name="Patient Instruction"
              />
              <Timing timing={dosage.timing} name="Timing" />
              <NameValue value={dosage.asNeededBoolean} name="As Needed" />
              <CodeableConcept
                resourceType=""
                codeableConcept={dosage.asNeededCodeableConcept}
                name="As Needed"
                searchParameter=""
              />
              <CodeableConcept
                resourceType=""
                codeableConcept={dosage.site}
                name="Site"
                searchParameter=""
              />
              <CodeableConcept
                resourceType=""
                codeableConcept={dosage.route}
                name="Route"
                searchParameter=""
              />
              <CodeableConcept
                resourceType=""
                codeableConcept={dosage.method}
                name="Method"
                searchParameter=""
              />

              {dosage.doseAndRate &&
                dosage.doseAndRate.map((dose, doseIndex) => (
                  <CodeableConcept
                    key={doseIndex}
                    resourceType=""
                    codeableConcept={dose.type}
                    name="Type"
                    searchParameter=""
                  />
                ))}
            </Box>
          ))}
        </Box>
      )}
    </>
  );
};

export default Dosage;
