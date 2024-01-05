import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

function TableComponent({ name, rows, columns }: any) {
  if (!Array.isArray(rows)) {
    rows = [rows];
  }

  if (rows && rows.length > 0 && rows[0]) {
    return (
      <Box>
        <Typography variant="h5">{name}</Typography>
        <TableContainer>
          <Table className="table" aria-label="simple table">
            <TableHead>
              <TableRow>
                {columns.map((column: any) => (
                  <TableCell key={column}>{column}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row: any, rowIndex: number) => (
                <TableRow key={rowIndex} sx={{ justifyContent: 'space-between' }}>
                  {columns.map((column: any, columnIndex: number) => (
                    <TableCell key={`${rowIndex}-${columnIndex}`}>
                      {row[`${column}`]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  } else {
    return null;
  }
}

export default TableComponent;
