/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TId } from '../simpleTypes/Id';
import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TIdentifier } from '../partials/Identifier';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TDateTime } from '../simpleTypes/DateTime';
import { TInvoiceParticipant } from '../partials/InvoiceParticipant';
import { TInvoiceLineItem } from '../partials/InvoiceLineItem';
import { TInvoicePriceComponent } from '../partials/InvoicePriceComponent';
import { TMoney } from '../partials/Money';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TAnnotation } from '../partials/Annotation';

export type TInvoice = {
    resourceType?: String;
    id?: TId;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    identifier?: TIdentifier[];
    status: String;
    cancelledReason?: String;
    type?: TCodeableConcept;
    subject?: TReference;
    recipient?: TReference;
    date?: TDateTime;
    participant?: TInvoiceParticipant[];
    issuer?: TReference;
    account?: TReference;
    lineItem?: TInvoiceLineItem[];
    totalPriceComponent?: TInvoicePriceComponent[];
    totalNet?: TMoney;
    totalGross?: TMoney;
    paymentTerms?: TMarkdown;
    note?: TAnnotation[];
};

