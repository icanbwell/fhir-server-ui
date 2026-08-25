import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMolecularSequenceReferenceSeq } from '../types/partials/MolecularSequenceReferenceSeq';
import CodeableConcept from './CodeableConcept';
import Reference from './Reference';

type TMolecularSequenceReferenceSeqProps = TBaseResourceProps & {
  field?: string;
  referenceSeq: TMolecularSequenceReferenceSeq | TMolecularSequenceReferenceSeq[] | undefined;
};

const MolecularSequenceReferenceSeqField = ({ referenceSeq, name, resourceType }: TMolecularSequenceReferenceSeqProps) => {
  if (!referenceSeq) {
    return null;
  }
  const values = Array.isArray(referenceSeq) ? referenceSeq : [referenceSeq];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.chromosome} name="Chromosome" resourceType={resourceType} />
          {value.genomeBuild && (
            <Typography component="div"><b>Genome Build:</b>&nbsp;{`${value.genomeBuild}`}</Typography>
          )}
          {value.orientation && (
            <Typography component="div"><b>Orientation:</b>&nbsp;{`${value.orientation}`}</Typography>
          )}
          <CodeableConcept codeableConcept={value.referenceSeqId} name="Reference Seq Id" resourceType={resourceType} />
          <Reference reference={value.referenceSeqPointer} name="Reference Seq Pointer" resourceType={resourceType} />
          {value.referenceSeqString && (
            <Typography component="div"><b>Reference Seq String:</b>&nbsp;{`${value.referenceSeqString}`}</Typography>
          )}
          {value.strand && (
            <Typography component="div"><b>Strand:</b>&nbsp;{`${value.strand}`}</Typography>
          )}
          {value.windowStart !== undefined && (
            <Typography component="div"><b>Window Start:</b>&nbsp;{`${value.windowStart}`}</Typography>
          )}
          {value.windowEnd !== undefined && (
            <Typography component="div"><b>Window End:</b>&nbsp;{`${value.windowEnd}`}</Typography>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default MolecularSequenceReferenceSeqField;
