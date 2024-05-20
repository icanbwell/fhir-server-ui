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
import { TClinicalUseDefinitionContraindication } from '../partials/ClinicalUseDefinitionContraindication';
import { TClinicalUseDefinitionIndication } from '../partials/ClinicalUseDefinitionIndication';
import { TClinicalUseDefinitionInteraction } from '../partials/ClinicalUseDefinitionInteraction';
import { TClinicalUseDefinitionUndesirableEffect } from '../partials/ClinicalUseDefinitionUndesirableEffect';
import { TClinicalUseDefinitionWarning } from '../partials/ClinicalUseDefinitionWarning';

export type TClinicalUseDefinition = {
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
    type: String;
    category?: TCodeableConcept[];
    subject?: TReference[];
    status?: TCodeableConcept;
    contraindication?: TClinicalUseDefinitionContraindication;
    indication?: TClinicalUseDefinitionIndication;
    interaction?: TClinicalUseDefinitionInteraction;
    population?: TReference[];
    undesirableEffect?: TClinicalUseDefinitionUndesirableEffect;
    warning?: TClinicalUseDefinitionWarning;
};

