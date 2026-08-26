import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TPackagedProductDefinitionPackage } from '../types/partials/PackagedProductDefinitionPackage';
import Identifier from './Identifier';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TPackagedProductDefinitionPackageProps = TBaseResourceProps & {
  field?: string;
  package: TPackagedProductDefinitionPackage | TPackagedProductDefinitionPackage[] | undefined;
};

const PackagedProductDefinitionPackageField = ({ package: pkg, name, resourceType }: TPackagedProductDefinitionPackageProps) => {
  if (!pkg) {
    return null;
  }
  const values = Array.isArray(pkg) ? pkg : [pkg];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Identifier identifier={value.identifier} name="Identifier" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.type} name="Type" resourceType={resourceType} />
          {value.quantity !== undefined && (
            <Typography component="div"><b>Quantity:</b>&nbsp;{`${value.quantity}`}</Typography>
          )}
          <CodeableConcept codeableConcept={value.material} name="Material" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.alternateMaterial} name="Alternate Material" resourceType={resourceType} />
          <Reference reference={value.manufacturer} name="Manufacturer" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default PackagedProductDefinitionPackageField;
