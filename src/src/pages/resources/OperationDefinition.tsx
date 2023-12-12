/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
OperationDefinition
    A formal computable definition of an operation (on the RESTful interface) or a
    named query (using the search interaction).
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TOperationDefinition } from '../../types/resources/OperationDefinition';

// Import all the partial resource
import Partials from '../../partials';

const OperationDefinition = ({ resource }: { resource: TOperationDefinition }): React.ReactElement => {
    return (
        <>
            <Link title="Direct link to Resource" to={`/4_0_0/${resource.resourceType}/${resource.id}`}>
                {resource.resourceType}/{resource.id}
            </Link>
            {
                resource.meta &&
                <Partials.Meta
                    meta={resource.meta}
                    name='Meta'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='meta'
                />
            }
            {
                resource.implicitRules &&
                <Partials.Uri
                    uri={resource.implicitRules}
                    name='Implicit Rules'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='implicit-rules'
                />
            }
            {
                resource.language &&
                <Partials.Code code={resource.language} name='Language'/>
            }
            {
                resource.text &&
                <Partials.Narrative
                    narrative={resource.text}
                    name='Text'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='text'
                />
            }
            {
                resource.extension &&
                <Partials.Extension
                    extension={resource.extension}
                    name='Extension'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='extension'
                />
            }
            {
                resource.modifierExtension &&
                <Partials.Extension
                    extension={resource.modifierExtension}
                    name='Modifier Extension'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='modifier-extension'
                />
            }
            {
                resource.url &&
                <Partials.Uri
                    uri={resource.url}
                    name='Url'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='url'
                />
            }
            {
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
            }
            {
                resource.kind &&
                <Partials.Code code={resource.kind} name='Kind'/>
            }
            {
                resource.experimental &&
                <Partials.Boolean
                    boolean={resource.experimental}
                    name='Experimental'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='experimental'
                />
            }
            {
                resource.date &&
                <Partials.DateTime
                    dateTime={resource.date}
                    name='Date'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='date'
                />
            }
            {
                resource.description &&
                <Partials.Markdown
                    markdown={resource.description}
                    name='Description'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='description'
                />
            }
            {
                resource.jurisdiction &&
                <Partials.CodeableConcept
                    codeableConcept={resource.jurisdiction}
                    name='Jurisdiction'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='jurisdiction'
                />
            }
            {
                resource.purpose &&
                <Partials.Markdown
                    markdown={resource.purpose}
                    name='Purpose'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='purpose'
                />
            }
            {
                resource.affectsState &&
                <Partials.Boolean
                    boolean={resource.affectsState}
                    name='Affects State'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='affects-state'
                />
            }
            {
                resource.code &&
                <Partials.Code code={resource.code} name='Code'/>
            }
            {
                resource.comment &&
                <Partials.Markdown
                    markdown={resource.comment}
                    name='Comment'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='comment'
                />
            }
            {
                resource.base &&
                <Partials.Canonical
                    canonical={resource.base}
                    name='Base'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='base'
                />
            }
            {
                resource.resource &&
                <Partials.Code code={resource.resource} name='Resource'/>
            }
            {
                resource.system &&
                <Partials.Boolean
                    boolean={resource.system}
                    name='System'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='system'
                />
            }
            {
                resource.type &&
                <Partials.Boolean
                    boolean={resource.type}
                    name='Type'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='type'
                />
            }
            {
                resource.instance &&
                <Partials.Boolean
                    boolean={resource.instance}
                    name='Instance'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='instance'
                />
            }
            {
                resource.inputProfile &&
                <Partials.Canonical
                    canonical={resource.inputProfile}
                    name='Input Profile'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='input-profile'
                />
            }
            {
                resource.outputProfile &&
                <Partials.Canonical
                    canonical={resource.outputProfile}
                    name='Output Profile'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='output-profile'
                />
            }
        </>
    );
};

export default OperationDefinition;
