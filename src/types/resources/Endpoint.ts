/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TMeta } from '../partials/Meta';
import { TUri } from '../simpleTypes/Uri';
import { TNarrative } from '../partials/Narrative';
import { TResourceContainer } from '../simpleTypes/ResourceContainer';
import { TExtension } from '../partials/Extension';
import { TIdentifier } from '../partials/Identifier';
import { TCoding } from '../partials/Coding';
import { TReference } from '../partials/Reference';
import { TContactPoint } from '../partials/ContactPoint';
import { TPeriod } from '../partials/Period';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TUrl } from '../simpleTypes/Url';

export type TEndpoint = {
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
    connectionType: TCoding;
    name?: String;
    managingOrganization?: TReference;
    contact?: TContactPoint[];
    period?: TPeriod;
    payloadType: TCodeableConcept[];
    payloadMimeType?: String[];
    address: TUrl;
    header?: String[];
};

