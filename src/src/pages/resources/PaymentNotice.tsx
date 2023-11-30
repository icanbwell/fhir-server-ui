/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
PaymentNotice
    This resource provides the status of the payment for goods and services
    rendered, and the request and response resource references.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';
import { TPaymentNotice } from '../../types/resources/PaymentNotice';

// Import all the partial resource
import Partials from '../../partials';

const PaymentNotice = ({ resource }: { resource: TPaymentNotice }): React.ReactElement => {
    return (
        <>
            <Link title="Direct link to Resource" href={`/4_0_0/${resource.resourceType}/${resource.id}`}>
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
                resource.request &&
                <Partials.Reference
                    reference={resource.request}
                    name='Request'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='request'
                />
            }
            {
                resource.response &&
                <Partials.Reference
                    reference={resource.response}
                    name='Response'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='response'
                />
            }
            {
                resource.created &&
                <Partials.DateTime
                    dateTime={resource.created}
                    name='Created'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='created'
                />
            }
            {
                resource.provider &&
                <Partials.Reference
                    reference={resource.provider}
                    name='Provider'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='provider'
                />
            }
            {
                resource.payment &&
                <Partials.Reference
                    reference={resource.payment}
                    name='Payment'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='payment'
                />
            }
            {
                resource.payee &&
                <Partials.Reference
                    reference={resource.payee}
                    name='Payee'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='payee'
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
                resource.amount &&
                <Partials.Money
                    money={resource.amount}
                    name='Amount'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='amount'
                />
            }
            {
                resource.paymentStatus &&
                <Partials.CodeableConcept
                    codeableConcept={resource.paymentStatus}
                    name='Payment Status'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='payment-status'
                />
            }
        </>
    );
};

export default PaymentNotice;
