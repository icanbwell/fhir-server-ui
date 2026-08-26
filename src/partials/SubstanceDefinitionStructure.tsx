import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TSubstanceDefinitionStructure } from '../types/partials/SubstanceDefinitionStructure';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TSubstanceDefinitionStructureProps = TBaseResourceProps & {
  field?: string;
  structure: TSubstanceDefinitionStructure | TSubstanceDefinitionStructure[] | undefined;
};

const SubstanceDefinitionStructureField = ({ structure, name, resourceType }: TSubstanceDefinitionStructureProps) => {
  if (!structure) {
    return null;
  }
  const values = Array.isArray(structure) ? structure : [structure];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.stereochemistry} name="Stereochemistry" resourceType={resourceType} />
          <CodeableConcept codeableConcept={value.opticalActivity} name="Optical Activity" resourceType={resourceType} />
          {value.molecularFormula && <Typography component="div"><b>Molecular Formula:</b>&nbsp;{value.molecularFormula}</Typography>}
          {value.molecularFormulaByMoiety && <Typography component="div"><b>Molecular Formula By Moiety:</b>&nbsp;{value.molecularFormulaByMoiety}</Typography>}
          <CodeableConcept codeableConcept={value.technique} name="Technique" resourceType={resourceType} />
          <Reference reference={value.sourceDocument} name="Source Document" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default SubstanceDefinitionStructureField;
