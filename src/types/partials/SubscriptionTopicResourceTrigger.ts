/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_types so do not edit manually

import { TExtension } from '../partials/Extension';
import { TMarkdown } from '../simpleTypes/Markdown';
import { TUri } from '../simpleTypes/Uri';
import { TSubscriptionTopicQueryCriteria } from '../partials/SubscriptionTopicQueryCriteria';

export type TSubscriptionTopicResourceTrigger = {
    id?: String;
    extension?: TExtension[];
    modifierExtension?: TExtension[];
    description?: TMarkdown;
    resource: TUri;
    supportedInteraction?: String[];
    queryCriteria?: TSubscriptionTopicQueryCriteria;
    fhirPathCriteria?: String;
};

