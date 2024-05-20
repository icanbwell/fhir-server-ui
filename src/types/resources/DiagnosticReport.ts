/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TIdentifier } from '../partials/Identifier';
import { TReference } from '../partials/Reference';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TDateTime } from '../simpleTypes/DateTime';
import { TPeriod } from '../partials/Period';
import { TInstant } from '../simpleTypes/Instant';
import { TDiagnosticReportMedia } from '../partials/DiagnosticReportMedia';
import { TAttachment } from '../partials/Attachment';

export type TDiagnosticReport = {
    resourceType?: String;
    id?: String;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    identifier?: TIdentifier[];
    basedOn?: TReference[];
    status: String;
    category?: TCodeableConcept[];
    code: TCodeableConcept;
    subject?: TReference;
    encounter?: TReference;
    effectiveDateTime?: TDateTime;
    effectivePeriod?: TPeriod;
    issued?: TInstant;
    performer?: TReference[];
    resultsInterpreter?: TReference[];
    specimen?: TReference[];
    result?: TReference[];
    imagingStudy?: TReference[];
    media?: TDiagnosticReportMedia[];
    conclusion?: String;
    conclusionCode?: TCodeableConcept[];
    presentedForm?: TAttachment[];
};

