/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
StructureDefinition
    A definition of a FHIR structure. This resource is used to describe the
    underlying resources, data types defined in FHIR, and also for describing
    extensions and constraints on resources and data types.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TStructureDefinition } from '../../types/resources/StructureDefinition';

// Import all the partial resource
import Partials from '../../partials';

const StructureDefinition = ({ resource }: { resource: TStructureDefinition }): React.ReactElement => {
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
                resource.identifier &&
                <Partials.Identifier
                    identifier={resource.identifier}
                    name='Identifier'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='identifier'
                />
            }
            {
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
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
                resource.copyright &&
                <Partials.Markdown
                    markdown={resource.copyright}
                    name='Copyright'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='copyright'
                />
            }
            {
                resource.keyword &&
                <Partials.Coding
                    coding={resource.keyword}
                    name='Keyword'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='keyword'
                />
            }
            {
                resource.fhirVersion &&
                <Partials.Code code={resource.fhirVersion} name='Fhir Version'/>
            }
            {
                resource.kind &&
                <Partials.Code code={resource.kind} name='Kind'/>
            }
            {
                resource.abstract &&
                <Partials.Boolean
                    boolean={resource.abstract}
                    name='Abstract'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='abstract'
                />
            }
            {
                resource.type &&
                <Partials.Uri
                    uri={resource.type}
                    name='Type'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='type'
                />
            }
            {
                resource.baseDefinition &&
                <Partials.Canonical
                    canonical={resource.baseDefinition}
                    name='Base Definition'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='base-definition'
                />
            }
            {
                resource.derivation &&
                <Partials.Code code={resource.derivation} name='Derivation'/>
            }
        </>
    );
};

export default StructureDefinition;
