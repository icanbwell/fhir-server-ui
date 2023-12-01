/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TBase64Binary } from '../simpleTypes/Base64Binary';
import { TUrl } from '../simpleTypes/Url';
import { TUnsignedInt } from '../simpleTypes/UnsignedInt';
import { TDateTime } from '../simpleTypes/DateTime';

export type TAttachment = {
    id?: String;
    extension?: TExtension[];
    contentType?: String;
    language?: String;
    data?: TBase64Binary;
    url?: TUrl;
    size?: TUnsignedInt;
    hash?: TBase64Binary;
    title?: String;
    creation?: TDateTime;
};

