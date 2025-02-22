/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_components so do not edit manually

/**
ObservationDefinition
    Set of definitional characteristics for a kind of observation or measurement
    produced or consumed by an orderable health care service.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { TObservationDefinition } from '../../types/resources/ObservationDefinition';

// Import all the partial resource
import Partials from '../../partials';
import { SecurityTagSystem } from '../../utils/securityTagSystem';
import { generateUuidV5, isUuid } from '../../utils/uid.util';

const ObservationDefinition = ({ resource }: { resource: TObservationDefinition }): React.ReactElement => {
    const sourceAssigningAuthority = resource?.meta?.security?.find(
        s => s.system === SecurityTagSystem.sourceAssigningAuthority
    )?.code;
    const uuid = resource.id && isUuid(`${resource.id}`) ?
        resource.id : generateUuidV5(`${resource.id}|${sourceAssigningAuthority}`);

    return (
        <>
            <Link title="Direct link to Resource" to={`/4_0_0/${resource.resourceType}/${uuid}`}>
                {resource.resourceType}/{uuid}
            </Link>
            {
                resource.meta &&
                <Partials.Meta
                    meta={resource.meta}
                    name='Meta'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='meta'
                />
            }
            {
                resource.implicitRules &&
                <Partials.Uri
                    uri={resource.implicitRules}
                    name='Implicit Rules'
                    resourceType={resource.resourceType}
                    id={uuid}
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
                    id={uuid}
                    searchParameter='text'
                />
            }
            {
                resource.extension &&
                <Partials.Extension
                    extension={resource.extension}
                    name='Extension'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='extension'
                />
            }
            {
                resource.modifierExtension &&
                <Partials.Extension
                    extension={resource.modifierExtension}
                    name='Modifier Extension'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='modifier-extension'
                />
            }
            {
                resource.category &&
                <Partials.CodeableConcept
                    codeableConcept={resource.category}
                    name='Category'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='category'
                />
            }
            {
                resource.code &&
                <Partials.CodeableConcept
                    codeableConcept={resource.code}
                    name='Code'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='code'
                />
            }
            {
                resource.identifier &&
                <Partials.Identifier
                    identifier={resource.identifier}
                    name='Identifier'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='identifier'
                />
            }
            {
                resource.permittedDataType &&
                <Partials.Code code={resource.permittedDataType} name='Permitted Data Type'/>
            }
            {
                resource.multipleResultsAllowed &&
                <Partials.Boolean
                    boolean={resource.multipleResultsAllowed}
                    name='Multiple Results Allowed'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='multiple-results-allowed'
                />
            }
            {
                resource.method &&
                <Partials.CodeableConcept
                    codeableConcept={resource.method}
                    name='Method'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='method'
                />
            }
            {
                resource.validCodedValueSet &&
                <Partials.Reference
                    reference={resource.validCodedValueSet}
                    name='Valid Coded Value Set'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='valid-coded-value-set'
                />
            }
            {
                resource.normalCodedValueSet &&
                <Partials.Reference
                    reference={resource.normalCodedValueSet}
                    name='Normal Coded Value Set'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='normal-coded-value-set'
                />
            }
            {
                resource.abnormalCodedValueSet &&
                <Partials.Reference
                    reference={resource.abnormalCodedValueSet}
                    name='Abnormal Coded Value Set'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='abnormal-coded-value-set'
                />
            }
            {
                resource.criticalCodedValueSet &&
                <Partials.Reference
                    reference={resource.criticalCodedValueSet}
                    name='Critical Coded Value Set'
                    resourceType={resource.resourceType}
                    id={uuid}
                    searchParameter='critical-coded-value-set'
                />
            }
        </>
    );
};

export default ObservationDefinition;
