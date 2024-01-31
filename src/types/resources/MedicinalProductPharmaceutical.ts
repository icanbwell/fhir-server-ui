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
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TMedicinalProductPharmaceuticalCharacteristics } from '../partials/MedicinalProductPharmaceuticalCharacteristics';
import { TMedicinalProductPharmaceuticalRouteOfAdministration } from '../partials/MedicinalProductPharmaceuticalRouteOfAdministration';

export type TMedicinalProductPharmaceutical = {
    resourceType?: String;
    id?: TId;
    meta?: TMeta;
    implicitRules?: TUri;
    language?: String;
    text?: TNarrative;
    contained?: TResourceContainer[];
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    identifier?: TIdentifier[];
    administrableDoseForm: TCodeableConcept;
    unitOfPresentation?: TCodeableConcept;
    ingredient?: TReference[];
    device?: TReference[];
    characteristics?: TMedicinalProductPharmaceuticalCharacteristics[];
    routeOfAdministration: TMedicinalProductPharmaceuticalRouteOfAdministration[];
};

