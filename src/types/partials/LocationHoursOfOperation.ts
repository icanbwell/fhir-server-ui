/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TTime } from '../simpleTypes/Time';

export type TLocationHoursOfOperation = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    daysOfWeek?: String[];
    allDay?: Boolean;
    openingTime?: TTime;
    closingTime?: TTime;
};
