import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
// import your partials as components
import CodeableConcept from './CodeableConcept';
import HumanNames from './HumanName';
import { TBaseResourceProps } from '../types/baseTypes';
import { TPatientContact } from '../types/partials/PatientContact';

type TPatientContactProps = TBaseResourceProps & {
  patientContact: TPatientContact|TPatientContact[]|undefined;
};

const PatientContact = ({ patientContact, name, resourceType }: TPatientContactProps) => {
  if (!patientContact) {
    return <></>;
  }
  // Ensure 'value' is always an array
  const values = Array.isArray(patientContact)
    ? patientContact
    : [patientContact];

  return (
    <>
      {values && values.length > 0 && values[0] && (
        <Box>
          {values.map((contact: TPatientContact, index: Number) => (
            <Box key={`${index}`}>
              <Typography variant="h4">{name}</Typography>
              {
                <React.Fragment>
                  <CodeableConcept
                    resourceType={resourceType}
                    codeableConcept={contact?.relationship}
                    name="Relationship"
                  />
                  <HumanNames
                    humanName={contact?.name}
                    resourceType={resourceType}
                  />
                </React.Fragment>
              }
            </Box>
          ))}
        </Box>
      )}
    </>
  );
};

export default PatientContact;
