/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TReference } from '../partials/Reference';
import { TSignature } from '../partials/Signature';

export type TVerificationResultValidator = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    organization: TReference;
    identityCertificate?: String;
    attestationSignature?: TSignature;
};

