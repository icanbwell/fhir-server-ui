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
import { TDateTime } from '../simpleTypes/DateTime';
import { TContactDetail } from '../partials/ContactDetail';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TUsageContext } from '../partials/UsageContext';
import { TDate } from '../simpleTypes/Date';
import { TPeriod } from '../partials/Period';
import { TRelatedArtifact } from '../partials/RelatedArtifact';
import { TCanonical } from '../simpleTypes/Canonical';

export type TResearchDefinition = {
    resourceType?: String;
    id?: String;
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
    shortTitle?: String;
    subtitle?: String;
    status: String;
    experimental?: Boolean;
    subjectCodeableConcept?: TCodeableConcept;
    subjectReference?: TReference;
    date?: TDateTime;
    publisher?: String;
    contact?: TContactDetail[];
    description?: TMarkdown;
    comment?: String[];
    useContext?: TUsageContext[];
    jurisdiction?: TCodeableConcept[];
    purpose?: TMarkdown;
    usage?: String;
    copyright?: TMarkdown;
    approvalDate?: TDate;
    lastReviewDate?: TDate;
    effectivePeriod?: TPeriod;
    topic?: TCodeableConcept[];
    author?: TContactDetail[];
    editor?: TContactDetail[];
    reviewer?: TContactDetail[];
    endorser?: TContactDetail[];
    relatedArtifact?: TRelatedArtifact[];
    library?: TCanonical[];
    population: TReference;
    exposure?: TReference;
    exposureAlternative?: TReference;
    outcome?: TReference;
};

