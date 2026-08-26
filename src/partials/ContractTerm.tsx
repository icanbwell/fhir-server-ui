import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TContractTerm } from '../types/partials/ContractTerm';
import CodeableConcept from './CodeableConcept';
import DateTime from './DateTime';
import Identifier from './Identifier';
import Period from './Period';
import Reference from './Reference';
import StringField from './String';

type TContractTermProps = TBaseResourceProps & {
  field?: string;
  term: TContractTerm | TContractTerm[] | undefined;
};

const ContractTerm = ({ term, name, resourceType }: TContractTermProps) => {
  if (!term) {
    return null;
  }
  const values = Array.isArray(term) ? term : [term];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Identifier identifier={value.identifier} name="Identifier" resourceType={resourceType} />
          <DateTime dateTime={value.issued} name="Issued" resourceType={resourceType} />
          <Period period={value.applies} name="Applies" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.topicCodeableConcept} name="Topic" resourceType={resourceType} />
          <Reference reference={value.topicReference} name="Topic Reference" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.subType} name="Sub Type" resourceType={resourceType} />
          <StringField string={value.text} name="Text" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ContractTerm;
