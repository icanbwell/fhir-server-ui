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
import { TReference } from '../partials/Reference';
import { TDateTime } from '../simpleTypes/DateTime';
import { TDate } from '../simpleTypes/Date';
import { TMoney } from '../partials/Money';
import { TCodeableConcept } from '../partials/CodeableConcept';

export type TPaymentNotice = {
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
    request?: TReference;
    response?: TReference;
    created: TDateTime;
    provider?: TReference;
    payment: TReference;
    paymentDate?: TDate;
    payee?: TReference;
    recipient: TReference;
    amount: TMoney;
    paymentStatus?: TCodeableConcept;
};
