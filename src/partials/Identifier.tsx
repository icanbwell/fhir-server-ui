import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Paper, Typography, Link } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TIdentifier } from '../types/partials/Identifier';
import { TCoding } from '../types/partials/Coding';

type TIdentifierProps = TBaseResourceProps & {
  identifier: TIdentifier|TIdentifier[]|undefined;
  isAdminPage?: boolean;
};

function Identifier({ identifier: identifiers, resourceType, name, isAdminPage }: TIdentifierProps) {
  if (identifiers && !Array.isArray(identifiers)) {
    identifiers = [identifiers];
  }

  if (!identifiers || identifiers.length === 0) {
    return <></>;
  }

  const basehref = isAdminPage ? '/admin/' : '/4_0_0/';

  return (
    <React.Fragment>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table aria-label="identifier table">
          <TableHead>
            <TableRow>
              <TableCell>Id</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>System</TableCell>
              <TableCell>Type Code</TableCell>
              <TableCell>Type System</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {identifiers &&
              identifiers.map((identifier: TIdentifier, index: number) => {
                if (identifier) {
                  return (
                    <TableRow key={index}>
                      <TableCell>{identifier.id}</TableCell>
                      <TableCell>
                        <Link
                          title={`Search for ${identifier.value}`}
                          href={`${basehref}${resourceType}?identifier=${encodeURIComponent(identifier.system?.toString() ?? '')}|${encodeURIComponent(identifier.value?.toString() ?? '')}`}
                        >
                          {identifier.value}
                        </Link>
                      </TableCell>
                      <TableCell>{identifier.system}</TableCell>
                      <TableCell>
                        {identifier.type &&
                          identifier.type.coding &&
                          identifier.type.coding.map((coding: TCoding, codingIndex: number) => (
                            <span key={codingIndex}>{coding.code} &nbsp;</span>
                          ))}
                      </TableCell>
                      <TableCell>
                        {identifier.type &&
                          identifier.type.coding &&
                          identifier.type.coding.map((coding: TCoding, codingIndex: number) => (
                            <span key={codingIndex}>
                              {coding.system} &nbsp;
                            </span>
                          ))}
                      </TableCell>
                    </TableRow>
                  );
                }
                return null;
              })}
          </TableBody>
        </Table>
      </TableContainer>
    </React.Fragment>
  );
}

export default Identifier;
