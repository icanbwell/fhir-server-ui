/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TExampleScenarioProcess } from '../partials/ExampleScenarioProcess';
import { TExampleScenarioOperation } from '../partials/ExampleScenarioOperation';
import { TExampleScenarioAlternative } from '../partials/ExampleScenarioAlternative';

export type TExampleScenarioStep = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    process?: TExampleScenarioProcess[];
    pause?: Boolean;
    operation?: TExampleScenarioOperation;
    alternative?: TExampleScenarioAlternative[];
};

