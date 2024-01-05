import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TQuantity } from '../types/partials/Quantity';

type TQuantityProps = TBaseResourceProps & {
  quantity: TQuantity|TQuantity[]|undefined;
};

function Quantity({ quantity: value = [], name = '' }: TQuantityProps) {
  if (!Array.isArray(value)) {
    value = [value];
  }

  if (value && value.length > 0 && value[0]) {
    return (
      <Box>
        <Typography variant="h4">{name}</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>comparator</TableCell>
                <TableCell>value</TableCell>
                <TableCell>unit</TableCell>
                <TableCell>system</TableCell>
                <TableCell>code</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {value.map((quantity: TQuantity, i: Number) => (
                <TableRow key={`${i}`}>
                  <TableCell>{quantity.comparator}</TableCell>
                  <TableCell>{`${quantity.value}`}</TableCell>
                  <TableCell>{quantity.unit}</TableCell>
                  <TableCell>{quantity.system}</TableCell>
                  <TableCell>{quantity.code}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  // Render nothing if no valid data is provided
  return null;
}

export default Quantity;
