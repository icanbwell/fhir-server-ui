import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TablePagination,
    Box,
    Typography,
} from '@mui/material';
import DOMPurify from 'dompurify';

import { getMandatorySectionContent } from '../constants/ipsConstants';
import { TableData } from './IPSViewer';

interface PaginatedTableProps {
    tableData: TableData;
    title?: string;
    sectionTitle: string
}



const PaginatedTable: React.FC<PaginatedTableProps> = ({ tableData, title, sectionTitle }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const handleChangePage = (event: unknown, newPage: number) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (tableData.rows.length === 0) {
        return <div
            className="ips-section-content"
            dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                    getMandatorySectionContent(sectionTitle) || ''
                )
            }}
        />;
    }

    // Determine if we should show pagination (only for more than 10 rows)
    const shouldPaginate = tableData.rows.length > 10;

    const startIndex = shouldPaginate ? page * rowsPerPage : 0;
    const endIndex = shouldPaginate ? startIndex + rowsPerPage : tableData.rows.length;
    const paginatedRows = tableData.rows.slice(startIndex, endIndex);

    return (
        <Box sx={{ mb: 2 }}>
            {title && (
                <Typography variant="h6" sx={{ mb: 1 }}>
                    {title}
                </Typography>
            )}
            <TableContainer component={Paper}>
                <Table size="small" aria-label="paginated table">
                    {tableData.headers.length > 0 && (
                        <TableHead>
                            <TableRow>
                                {tableData.headers.map((header, index) => (
                                    <TableCell key={index}>{header}</TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                    )}
                    <TableBody>
                        {paginatedRows.map((row, rowIndex) => (
                            <TableRow key={startIndex + rowIndex}>
                                {row.map((cell, cellIndex) => (
                                    <TableCell key={cellIndex}>{cell}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {/* Only show pagination for tables with more than 10 rows */}
                {shouldPaginate && (
                    <TablePagination
                        rowsPerPageOptions={[10, 25, 50]}
                        component="div"
                        count={tableData.rows.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={handleChangePage}
                        onRowsPerPageChange={handleChangeRowsPerPage}
                    />
                )}
            </TableContainer>
        </Box>
    );
};

export default PaginatedTable;
