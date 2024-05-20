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
import { TReference } from '../partials/Reference';
import { TDateTime } from '../simpleTypes/DateTime';
import { TPeriod } from '../partials/Period';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TMeasureReportGroup } from '../partials/MeasureReportGroup';

export type TMeasureReport = {
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
    status: String;
    type: String;
    measure: TCanonical;
    subject?: TReference;
    date?: TDateTime;
    reporter?: TReference;
    period: TPeriod;
    improvementNotation?: TCodeableConcept;
    group?: TMeasureReportGroup[];
    evaluatedResource?: TReference[];
};

