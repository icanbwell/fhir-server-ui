import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TSubstanceDefinitionName } from '../types/partials/SubstanceDefinitionName';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TSubstanceDefinitionNameProps = TBaseResourceProps & {
  field?: string;
  name_: TSubstanceDefinitionName | TSubstanceDefinitionName[] | undefined;
};

const SubstanceDefinitionNameField = ({ name_, name, resourceType }: TSubstanceDefinitionNameProps) => {
  if (!name_) {
    return null;
  }
  const values = Array.isArray(name_) ? name_ : [name_];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.name && <Typography component="div"><b>Name:</b>&nbsp;{value.name}</Typography>}
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.status} name="Status" resourceType={resourceType} />
          {value.preferred !== undefined && <Typography component="div"><b>Preferred:</b>&nbsp;{String(value.preferred)}</Typography>}
          <CodeableConcept codeableConcept={value.domain} name="Domain" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.jurisdiction} name="Jurisdiction" resourceType={resourceType} />
          <Reference reference={value.source} name="Source" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default SubstanceDefinitionNameField;
