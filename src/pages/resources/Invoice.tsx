/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
Invoice
    Invoice containing collected ChargeItems from an Account with calculated
    individual and total price for Billing purpose.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TInvoice } from '../../types/resources/Invoice';

// Import all the partial resource
import Partials from '../../partials';

const Invoice = ({ resource }: { resource: TInvoice }): React.ReactElement => {
    return (
        <>
            <Link title="Direct link to Resource" to={`/4_0_0/${resource.resourceType}/${resource.id}`}>
                {resource.resourceType}/{resource.id}
            </Link>
            {
                resource.meta &&
                <Partials.Meta
                    meta={resource.meta}
                    name='Meta'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='meta'
                />
            }
            {
                resource.implicitRules &&
                <Partials.Uri
                    uri={resource.implicitRules}
                    name='Implicit Rules'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='implicit-rules'
                />
            }
            {
                resource.language &&
                <Partials.Code code={resource.language} name='Language'/>
            }
            {
                resource.text &&
                <Partials.Narrative
                    narrative={resource.text}
                    name='Text'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='text'
                />
            }
            {
                resource.extension &&
                <Partials.Extension
                    extension={resource.extension}
                    name='Extension'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='extension'
                />
            }
            {
                resource.modifierExtension &&
                <Partials.Extension
                    extension={resource.modifierExtension}
                    name='Modifier Extension'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='modifier-extension'
                />
            }
            {
                resource.identifier &&
                <Partials.Identifier
                    identifier={resource.identifier}
                    name='Identifier'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='identifier'
                />
            }
            {
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
            }
            {
                resource.type &&
                <Partials.CodeableConcept
                    codeableConcept={resource.type}
                    name='Type'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='type'
                />
            }
            {
                resource.subject &&
                <Partials.Reference
                    reference={resource.subject}
                    name='Subject'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='subject'
                />
            }
            {
                resource.recipient &&
                <Partials.Reference
                    reference={resource.recipient}
                    name='Recipient'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='recipient'
                />
            }
            {
                resource.date &&
                <Partials.DateTime
                    dateTime={resource.date}
                    name='Date'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='date'
                />
            }
            {
                resource.issuer &&
                <Partials.Reference
                    reference={resource.issuer}
                    name='Issuer'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='issuer'
                />
            }
            {
                resource.account &&
                <Partials.Reference
                    reference={resource.account}
                    name='Account'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='account'
                />
            }
            {
                resource.lineItem &&
                <Partials.InvoiceLineItem
                    invoiceLineItem={resource.lineItem}
                    name='Line Item'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='line-item'
                />
            }
            {
                resource.totalPriceComponent &&
                <Partials.InvoicePriceComponent
                    invoicePriceComponent={resource.totalPriceComponent}
                    name='Total Price Component'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='total-price-component'
                />
            }
            {
                resource.totalNet &&
                <Partials.Money
                    money={resource.totalNet}
                    name='Total Net'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='total-net'
                />
            }
            {
                resource.totalGross &&
                <Partials.Money
                    money={resource.totalGross}
                    name='Total Gross'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='total-gross'
                />
            }
            {
                resource.paymentTerms &&
                <Partials.Markdown
                    markdown={resource.paymentTerms}
                    name='Payment Terms'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='payment-terms'
                />
            }
            {
                resource.note &&
                <Partials.Annotation
                    annotation={resource.note}
                    name='Note'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='note'
                />
            }
        </>
    );
};

export default Invoice;
