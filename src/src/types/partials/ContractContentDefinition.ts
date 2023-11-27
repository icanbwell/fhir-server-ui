/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TCodeableConcept } from '../partials/CodeableConcept';
import { TReference } from '../partials/Reference';
import { TDateTime } from '../simpleTypes/DateTime';
import { TMarkdown } from '../simpleTypes/Markdown';

export type TContractContentDefinition = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    type: TCodeableConcept;
    subType?: TCodeableConcept;
    publisher?: TReference;
    publicationDate?: TDateTime;
    publicationStatus: String;
    copyright?: TMarkdown;
};

