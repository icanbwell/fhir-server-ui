import {
  Box,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface SelectableTableProps {
  name: string;
  rows: any[];
  columns: string[];
  onSelectionChange: (_selectedRows: any[]) => void;
  getRowId?: (_row: any, _index: number) => string | number;
}

function SelectableTable({
  name,
  rows,
  columns,
  onSelectionChange,
  getRowId = (_row, index) => index
}: SelectableTableProps) {
  // Normalize rows to always be an array
  let normalizedRows = Array.isArray(rows) ? rows : [rows];

  // State management
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string | number>>(new Set());

  // Handle select all checkbox
  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = normalizedRows.map((row, index) => getRowId(row, index));
      const newSelectedRows = new Set(allIds);
      setSelectedRowIds(newSelectedRows);
      onSelectionChange(Array.from(newSelectedRows));
    }
    else {
      setSelectedRowIds(new Set());
      onSelectionChange([]);
    }
  };

  // Handle row selection toggle
  const toggleRowSelection = (rowId: string | number) => {
    let newSelectedRows = new Set(selectedRowIds);
    const isSelected = selectedRowIds.has(rowId);

    if (isSelected) {
      newSelectedRows.delete(rowId);
    } else {
      newSelectedRows.add(rowId);
    }
    setSelectedRowIds(newSelectedRows);
    onSelectionChange(Array.from(newSelectedRows));
  };

  // Handle individual row checkbox selection
  const handleSelectRow = (rowId: string | number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    event.stopPropagation(); // Prevent row click from firing
    toggleRowSelection(rowId);
  };

  // Handle row click
  const handleRowClick = (rowId: string | number) => {
    toggleRowSelection(rowId);
  };

  // Calculate selection states
  const isAllSelected = normalizedRows.length > 0 && selectedRowIds.size === normalizedRows.length;
  const isSomeSelected = selectedRowIds.size > 0 && selectedRowIds.size < normalizedRows.length;

  // Render empty state
  if (!normalizedRows || normalizedRows.length === 0 || !normalizedRows[0]) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h5">{name}</Typography>
        <Typography variant="body2" color="text.secondary">
          {selectedRowIds.size} of {normalizedRows.length} selected
        </Typography>
      </Box>
      <TableContainer>
        <Table className="table" aria-label="selectable table">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={isSomeSelected}
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                />
              </TableCell>
              {columns.map((column: string) => (
                <TableCell key={column}>{column}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {normalizedRows.map((row: any, rowIndex: number) => {
              const rowId = getRowId(row, rowIndex);
              return (
                <TableRow
                  key={rowId}
                  selected={selectedRowIds.has(rowId)}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleRowClick(rowId)}
                >
                  <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedRowIds.has(rowId)}
                      onChange={handleSelectRow(rowId)}
                    />
                  </TableCell>
                  {columns.map((column: string, columnIndex: number) => {
                    const value = Object.prototype.hasOwnProperty.call(row, column) ? row[column] : undefined; // eslint-disable-line security/detect-object-injection
                    return (
                      <TableCell key={`${rowId}-${columnIndex}`}>
                        {typeof value === 'object' && value !== null
                          ? JSON.stringify(value)
                          : String(value ?? '')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}

export default SelectableTable;
