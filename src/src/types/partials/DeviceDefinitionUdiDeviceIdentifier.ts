/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TUri } from '../simpleTypes/Uri';

export type TDeviceDefinitionUdiDeviceIdentifier = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    deviceIdentifier: String;
    issuer: TUri;
    jurisdiction: TUri;
};

