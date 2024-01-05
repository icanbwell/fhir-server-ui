import React from 'react';
import {Typography, Table, TableHead, TableBody, TableRow, TableCell, Box, Link} from '@mui/material';
import CodeableConcept from './CodeableConcept';
import InvoicePriceComponent from './InvoicePriceComponent';
import { TBaseResourceProps } from '../types/baseTypes';
import { TInvoiceLineItem } from '../types/partials/InvoiceLineItem';

type TInvoiceLineItemProps = TBaseResourceProps & {
    invoiceLineItem: TInvoiceLineItem|TInvoiceLineItem[]|undefined;
};

const InvoiceLineItem = ({ invoiceLineItem: lineItems, name }: TInvoiceLineItemProps) => {
    if (lineItems && !Array.isArray(lineItems)) {
        lineItems = [lineItems];
    }
    if (lineItems && lineItems.length > 0 && lineItems[0]) {
        return (
            <Box>
                <Typography variant="h4">{name}</Typography>
                <Table className="table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Item</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Price Component</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {lineItems.map((lineItem: TInvoiceLineItem) => {
                            return (
                                <TableRow>
                                    <TableCell>
                                        <Link href={`/4_0_0/${lineItem.chargeItemReference?.reference}`} >
                                            {lineItem.chargeItemReference?.reference}
                                        </Link>
                                    </TableCell>
                                    <TableCell>
                                        <CodeableConcept resourceType="Invoice" codeableConcept={lineItem.chargeItemCodeableConcept} name="Code" searchParameter="" />
                                    </TableCell>
                                    <TableCell>
                                        <InvoicePriceComponent resourceType="Invoice" name="" invoicePriceComponent={lineItem.priceComponent} />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </Box>
        );
    } else {
        return null;
    }
};

export default InvoiceLineItem;
