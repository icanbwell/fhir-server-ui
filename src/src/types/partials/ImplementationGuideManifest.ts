/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TUrl } from '../simpleTypes/Url';
import { TImplementationGuideResource1 } from '../partials/ImplementationGuideResource1';
import { TImplementationGuidePage1 } from '../partials/ImplementationGuidePage1';

export type TImplementationGuideManifest = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    rendering?: TUrl;
    resource: TImplementationGuideResource1[];
    page?: TImplementationGuidePage1[];
    image?: String[];
    other?: String[];
};

