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
import { TDateTime } from '../simpleTypes/DateTime';
import { TContactDetail } from '../partials/ContactDetail';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TAnnotation } from '../partials/Annotation';
import { TUsageContext } from '../partials/UsageContext';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TDate } from '../simpleTypes/Date';
import { TPeriod } from '../partials/Period';
import { TRelatedArtifact } from '../partials/RelatedArtifact';
import { TReference } from '../partials/Reference';
import { TRiskEvidenceSynthesisSampleSize } from '../partials/RiskEvidenceSynthesisSampleSize';
import { TRiskEvidenceSynthesisRiskEstimate } from '../partials/RiskEvidenceSynthesisRiskEstimate';
import { TRiskEvidenceSynthesisCertainty } from '../partials/RiskEvidenceSynthesisCertainty';

export type TRiskEvidenceSynthesis = {
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
    date?: TDateTime;
    publisher?: String;
    contact?: TContactDetail[];
    description?: TMarkdown;
    note?: TAnnotation[];
    useContext?: TUsageContext[];
    jurisdiction?: TCodeableConcept[];
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
    synthesisType?: TCodeableConcept;
    studyType?: TCodeableConcept;
    population: TReference;
    exposure?: TReference;
    outcome: TReference;
    sampleSize?: TRiskEvidenceSynthesisSampleSize;
    riskEstimate?: TRiskEvidenceSynthesisRiskEstimate;
    certainty?: TRiskEvidenceSynthesisCertainty[];
};

