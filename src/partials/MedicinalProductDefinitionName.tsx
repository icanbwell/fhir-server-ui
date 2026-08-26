import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMedicinalProductDefinitionName } from '../types/partials/MedicinalProductDefinitionName';
import CodeableConcept from './CodeableConcept';

type TMedicinalProductDefinitionNameProps = TBaseResourceProps & {
  field?: string;
  name_: TMedicinalProductDefinitionName | TMedicinalProductDefinitionName[] | undefined;
};

const MedicinalProductDefinitionNameField = ({ name_, name, resourceType }: TMedicinalProductDefinitionNameProps) => {
  if (!name_) {
    return null;
  }
  const values = Array.isArray(name_) ? name_ : [name_];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          {value.productName && <Typography component="div"><b>Product Name:</b>&nbsp;{value.productName}</Typography>}
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          {value.namePart && value.namePart.length > 0 && (
            <Typography component="div"><b>Name Part Count:</b>&nbsp;{value.namePart.length}</Typography>
          )}
          {value.countryLanguage && value.countryLanguage.length > 0 && (
            <Typography component="div"><b>Country Language Count:</b>&nbsp;{value.countryLanguage.length}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default MedicinalProductDefinitionNameField;
