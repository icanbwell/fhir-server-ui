import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TContractLegal } from '../types/partials/ContractLegal';
import Attachment from './Attachment';
import Reference from './Reference';

type TContractLegalProps = TBaseResourceProps & {
  field?: string;
  legal: TContractLegal | TContractLegal[] | undefined;
};

const ContractLegal = ({ legal, name, resourceType }: TContractLegalProps) => {
  if (!legal) {
    return null;
  }
  const values = Array.isArray(legal) ? legal : [legal];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Attachment attachment={value.contentAttachment} name="Content Attachment" resourceType={resourceType} />
          <Reference reference={value.contentReference} name="Content Reference" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ContractLegal;
