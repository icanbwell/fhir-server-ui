/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TIdentifier } from '../partials/Identifier';
import { TCanonical } from '../simpleTypes/Canonical';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TDateTime } from '../simpleTypes/DateTime';
import { TAnnotation } from '../partials/Annotation';
import { TDataRequirement } from '../partials/DataRequirement';

export type TGuidanceResponse = {
    resourceType?: String;
    id?: String;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    requestIdentifier?: TIdentifier;
    identifier?: TIdentifier[];
    moduleUri?: TUri;
    moduleCanonical?: TCanonical;
    moduleCodeableConcept?: TCodeableConcept;
    status: String;
    subject?: TReference;
    encounter?: TReference;
    occurrenceDateTime?: TDateTime;
    performer?: TReference;
    reasonCode?: TCodeableConcept[];
    reasonReference?: TReference[];
    note?: TAnnotation[];
    evaluationMessage?: TReference[];
    outputParameters?: TReference;
    result?: TReference;
    dataRequirement?: TDataRequirement[];
};

