import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TOrganizationContact } from '../types/partials/OrganizationContact';
import CodeableConcept from './CodeableConcept';
import HumanName from './HumanName';
import ContactPoint from './ContactPoint';
import Address from './Address';

type TOrganizationContactProps = TBaseResourceProps & {
  field?: string;
  contact: TOrganizationContact | TOrganizationContact[] | undefined;
};

const OrganizationContactField = ({ contact, name, resourceType }: TOrganizationContactProps) => {
  if (!contact) {
    return null;
  }
  const values = Array.isArray(contact) ? contact : [contact];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <CodeableConcept codeableConcept={value.purpose} name="Purpose" resourceType={resourceType} />
          <HumanName humanName={value.name} name="Name" resourceType={resourceType} />
          <ContactPoint contactPoint={value.telecom} name="Telecom" resourceType={resourceType} />
          <Address address={value.address} name="Address" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default OrganizationContactField;
