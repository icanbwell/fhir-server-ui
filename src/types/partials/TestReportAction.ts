/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TTestReportOperation } from '../partials/TestReportOperation';
import { TTestReportAssert } from '../partials/TestReportAssert';

export type TTestReportAction = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    operation?: TTestReportOperation;
    assert?: TTestReportAssert;
};
