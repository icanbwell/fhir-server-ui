/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TDecimal } from '../simpleTypes/Decimal';
import { TInt } from '../simpleTypes/Int';
import { TDate } from '../simpleTypes/Date';
import { TDateTime } from '../simpleTypes/DateTime';
import { TTime } from '../simpleTypes/Time';
import { TUri } from '../simpleTypes/Uri';
import { TAttachment } from '../partials/Attachment';
import { TCoding } from '../partials/Coding';
import { TQuantity } from '../partials/Quantity';
import { TReference } from '../partials/Reference';
import { TQuestionnaireResponseItem } from '../partials/QuestionnaireResponseItem';

export type TQuestionnaireResponseAnswer = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    valueBoolean?: Boolean;
    valueDecimal?: TDecimal;
    valueInteger?: TInt;
    valueDate?: TDate;
    valueDateTime?: TDateTime;
    valueTime?: TTime;
    valueString?: String;
    valueUri?: TUri;
    valueAttachment?: TAttachment;
    valueCoding?: TCoding;
    valueQuantity?: TQuantity;
    valueReference?: TReference;
    item?: TQuestionnaireResponseItem[];
};

