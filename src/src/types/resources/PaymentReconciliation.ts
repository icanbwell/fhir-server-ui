/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TId } from '../simpleTypes/Id';
import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TIdentifier } from '../partials/Identifier';
import { TPeriod } from '../partials/Period';
import { TDateTime } from '../simpleTypes/DateTime';
import { TReference } from '../partials/Reference';
import { TDate } from '../simpleTypes/Date';
import { TMoney } from '../partials/Money';
import { TPaymentReconciliationDetail } from '../partials/PaymentReconciliationDetail';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TPaymentReconciliationProcessNote } from '../partials/PaymentReconciliationProcessNote';

export type TPaymentReconciliation = {
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
    period?: TPeriod;
    created: TDateTime;
    paymentIssuer?: TReference;
    request?: TReference;
    requestor?: TReference;
    outcome?: String;
    disposition?: String;
    paymentDate: TDate;
    paymentAmount: TMoney;
    paymentIdentifier?: TIdentifier;
    detail?: TPaymentReconciliationDetail[];
    formCode?: TCodeableConcept;
    processNote?: TPaymentReconciliationProcessNote[];
};

