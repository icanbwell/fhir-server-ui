/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TId } from '../simpleTypes/Id';
import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TDateTime } from '../simpleTypes/DateTime';
import { TContactDetail } from '../partials/ContactDetail';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TUsageContext } from '../partials/UsageContext';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TImplementationGuideDependsOn } from '../partials/ImplementationGuideDependsOn';
import { TImplementationGuideGlobal } from '../partials/ImplementationGuideGlobal';
import { TImplementationGuideDefinition } from '../partials/ImplementationGuideDefinition';
import { TImplementationGuideManifest } from '../partials/ImplementationGuideManifest';

export type TImplementationGuide = {
    resourceType?: String;
    id?: TId;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    url: TUri;
    version?: String;
    name: String;
    title?: String;
    status: String;
    experimental?: Boolean;
    date?: TDateTime;
    publisher?: String;
    contact?: TContactDetail[];
    description?: TMarkdown;
    useContext?: TUsageContext[];
    jurisdiction?: TCodeableConcept[];
    copyright?: TMarkdown;
    packageId: TId;
    license?: String;
    fhirVersion: String[];
    dependsOn?: TImplementationGuideDependsOn[];
    global?: TImplementationGuideGlobal[];
    definition?: TImplementationGuideDefinition;
    manifest?: TImplementationGuideManifest;
};

