/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TExampleScenarioVersion } from '../partials/ExampleScenarioVersion';
import { TExampleScenarioContainedInstance } from '../partials/ExampleScenarioContainedInstance';

export type TExampleScenarioInstance = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    resourceId: String;
    resourceType: String;
    name?: String;
    description?: TMarkdown;
    version?: TExampleScenarioVersion[];
    containedInstance?: TExampleScenarioContainedInstance[];
};

