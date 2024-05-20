/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TIdentifier } from '../partials/Identifier';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TInstant } from '../simpleTypes/Instant';
import { TDocumentReferenceRelatesTo } from '../partials/DocumentReferenceRelatesTo';
import { TDocumentReferenceContent } from '../partials/DocumentReferenceContent';
import { TDocumentReferenceContext } from '../partials/DocumentReferenceContext';

export type TDocumentReference = {
    resourceType?: String;
    id?: String;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    masterIdentifier?: TIdentifier;
    identifier?: TIdentifier[];
    status: String;
    docStatus?: String;
    type?: TCodeableConcept;
    category?: TCodeableConcept[];
    subject?: TReference;
    date?: TInstant;
    author?: TReference[];
    authenticator?: TReference;
    custodian?: TReference;
    relatesTo?: TDocumentReferenceRelatesTo[];
    description?: String;
    securityLabel?: TCodeableConcept[];
    content: TDocumentReferenceContent[];
    context?: TDocumentReferenceContext;
};

