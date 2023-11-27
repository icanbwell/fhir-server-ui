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
import { TDateTime } from '../simpleTypes/DateTime';
import { TContactDetail } from '../partials/ContactDetail';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TUsageContext } from '../partials/UsageContext';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TCanonical } from '../simpleTypes/Canonical';
import { TUnsignedInt } from '../simpleTypes/UnsignedInt';
import { TCodeSystemFilter } from '../partials/CodeSystemFilter';
import { TCodeSystemProperty } from '../partials/CodeSystemProperty';
import { TCodeSystemConcept } from '../partials/CodeSystemConcept';

export type TCodeSystem = {
    resourceType?: String;
    id?: TId;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    url?: TUri;
    identifier?: TIdentifier[];
    version?: String;
    name?: String;
    title?: String;
    status: String;
    experimental?: Boolean;
    date?: TDateTime;
    publisher?: String;
    contact?: TContactDetail[];
    description?: TMarkdown;
    useContext?: TUsageContext[];
    jurisdiction?: TCodeableConcept[];
    purpose?: TMarkdown;
    copyright?: TMarkdown;
    caseSensitive?: Boolean;
    valueSet?: TCanonical;
    hierarchyMeaning?: String;
    compositional?: Boolean;
    versionNeeded?: Boolean;
    content: String;
    supplements?: TCanonical;
    count?: TUnsignedInt;
    filter?: TCodeSystemFilter[];
    property?: TCodeSystemProperty[];
    concept?: TCodeSystemConcept[];
};

