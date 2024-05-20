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
import { TDeviceUdiCarrier } from '../partials/DeviceUdiCarrier';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TDateTime } from '../simpleTypes/DateTime';
import { TDeviceDeviceName } from '../partials/DeviceDeviceName';
import { TDeviceSpecialization } from '../partials/DeviceSpecialization';
import { TDeviceVersion } from '../partials/DeviceVersion';
import { TDeviceProperty } from '../partials/DeviceProperty';
import { TContactPoint } from '../partials/ContactPoint';
import { TAnnotation } from '../partials/Annotation';

export type TDevice = {
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
    definition?: TReference;
    udiCarrier?: TDeviceUdiCarrier[];
    status?: String;
    statusReason?: TCodeableConcept[];
    distinctIdentifier?: String;
    manufacturer?: String;
    manufactureDate?: TDateTime;
    expirationDate?: TDateTime;
    lotNumber?: String;
    serialNumber?: String;
    deviceName?: TDeviceDeviceName[];
    modelNumber?: String;
    partNumber?: String;
    type?: TCodeableConcept;
    specialization?: TDeviceSpecialization[];
    version?: TDeviceVersion[];
    property?: TDeviceProperty[];
    patient?: TReference;
    owner?: TReference;
    contact?: TContactPoint[];
    location?: TReference;
    url?: TUri;
    note?: TAnnotation[];
    safety?: TCodeableConcept[];
    parent?: TReference;
};

