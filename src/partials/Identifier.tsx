import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TIdentifier } from '../types/partials/Identifier';
import { TCoding } from '../types/partials/Coding';

type TIdentifierProps = TBaseResourceProps & {
  identifier: TIdentifier|TIdentifier[]|undefined;
};

function Identifier({ identifier: identifiers, resourceType, name }: TIdentifierProps) {
  if (identifiers && !Array.isArray(identifiers)) {
    identifiers = [identifiers];
  }

  if (!identifiers || identifiers.length === 0) {
    return <></>;
  }

  return (
    <React.Fragment>
      <Typography variant="h4">{name}</Typography>
      <TableContainer>
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
              identifiers.map((identifier: TIdentifier) => {
                if (identifier) {
                  return (
                    <TableRow key={`${identifier.id}`}>
                      <TableCell>{identifier.id}</TableCell>
                      <TableCell>
                        <a
                          title={`Search for ${identifier.value}`}
                          href={`/4_0_0/${resourceType}?identifier=${encodeURIComponent(identifier.system?.toString() ?? '')}|${encodeURIComponent(identifier.value?.toString() ?? '')}`}
                        >
                          {identifier.value}
                        </a>
                      </TableCell>
                      <TableCell>{identifier.system}</TableCell>
                      <TableCell>
                        {identifier.type &&
                          identifier.type.coding &&
                          identifier.type.coding.map((coding: TCoding) => (
                            <span key={`${coding.code}`}>{coding.code} &nbsp;</span>
                          ))}
                      </TableCell>
                      <TableCell>
                        {identifier.type &&
                          identifier.type.coding &&
                          identifier.type.coding.map((coding: TCoding) => (
                            <span key={`${coding.system}`}>
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
