/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TTestReportAction1 } from '../partials/TestReportAction1';

export type TTestReportTest = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    name?: String;
    description?: String;
    action: TTestReportAction1[];
};

