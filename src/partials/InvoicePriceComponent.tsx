import React from 'react';
import {Typography, Table, TableHead, TableBody, TableRow, TableCell, Box} from '@mui/material';
import CodeableConcept from './CodeableConcept';
import Money from './Money';
import { TBaseResourceProps } from '../types/baseTypes';
import { TInvoicePriceComponent } from '../types/partials/InvoicePriceComponent';

type TInvoicePriceComponentProps = TBaseResourceProps & {
    invoicePriceComponent: TInvoicePriceComponent|TInvoicePriceComponent[]|undefined;
};

const InvoicePriceComponent = ({ name, invoicePriceComponent: priceComponents, resourceType }: TInvoicePriceComponentProps) => {
    if (priceComponents && !Array.isArray(priceComponents)) {
        priceComponents = [priceComponents];
    }
    if (priceComponents && priceComponents.length > 0 && priceComponents[0]) {
        return (
            <Box>
                <Typography variant="h4">{name}</Typography>
                <Table className="table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Id</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Code</TableCell>
                            <TableCell>Amount</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {priceComponents.map((priceComponent: TInvoicePriceComponent) => {
                                return (
                                    <TableRow key={`${priceComponent.id}`}>
                                        <TableCell>{priceComponent.id}</TableCell>
                                        <TableCell>{priceComponent.type}</TableCell>
                                        <TableCell>
                                            <CodeableConcept resourceType={resourceType} codeableConcept={priceComponent.code} name="Code" searchParameter="" />
                                        </TableCell>
                                        <TableCell>
                                            <Money name="" money={priceComponent.amount} />
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

export default InvoicePriceComponent;
