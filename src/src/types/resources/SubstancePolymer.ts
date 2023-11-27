/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TId } from '../simpleTypes/Id';
import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TSubstancePolymerMonomerSet } from '../partials/SubstancePolymerMonomerSet';
import { TSubstancePolymerRepeat } from '../partials/SubstancePolymerRepeat';

export type TSubstancePolymer = {
    resourceType?: String;
    id?: TId;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    class_?: TCodeableConcept;
    geometry?: TCodeableConcept;
    copolymerConnectivity?: TCodeableConcept[];
    modification?: String[];
    monomerSet?: TSubstancePolymerMonomerSet[];
    repeat?: TSubstancePolymerRepeat[];
};

