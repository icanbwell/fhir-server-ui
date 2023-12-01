/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

import { TExtension } from '../partials/Extension';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TExampleScenarioStep } from '../partials/ExampleScenarioStep';

export type TExampleScenarioProcess = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    title: String;
    description?: TMarkdown;
    preConditions?: TMarkdown;
    postConditions?: TMarkdown;
    step?: TExampleScenarioStep[];
};

