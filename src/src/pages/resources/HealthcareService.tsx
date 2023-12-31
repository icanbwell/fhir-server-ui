/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
HealthcareService
    The details of a healthcare service available at a location.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from 'react-router-dom';
import { Typography } from '@mui/material';
import { THealthcareService } from '../../types/resources/HealthcareService';

// Import all the partial resource
import Partials from '../../partials';

const HealthcareService = ({ resource }: { resource: THealthcareService }): React.ReactElement => {
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
                resource.active &&
                <Partials.Boolean
                    boolean={resource.active}
                    name='Active'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='active'
                />
            }
            {
                resource.providedBy &&
                <Partials.Reference
                    reference={resource.providedBy}
                    name='Provided By'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='provided-by'
                />
            }
            {
                resource.category &&
                <Partials.CodeableConcept
                    codeableConcept={resource.category}
                    name='Category'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='category'
                />
            }
            {
                resource.type &&
                <Partials.CodeableConcept
                    codeableConcept={resource.type}
                    name='Type'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='type'
                />
            }
            {
                resource.specialty &&
                <Partials.CodeableConcept
                    codeableConcept={resource.specialty}
                    name='Specialty'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='specialty'
                />
            }
            {
                resource.location &&
                <Partials.Reference
                    reference={resource.location}
                    name='Location'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='location'
                />
            }
            {
                resource.extraDetails &&
                <Partials.Markdown
                    markdown={resource.extraDetails}
                    name='Extra Details'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='extra-details'
                />
            }
            {
                resource.photo &&
                <Partials.Attachment
                    attachment={resource.photo}
                    name='Photo'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='photo'
                />
            }
            {
                resource.telecom &&
                <Partials.ContactPoint
                    contactPoint={resource.telecom}
                    name='Telecom'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='telecom'
                />
            }
            {
                resource.coverageArea &&
                <Partials.Reference
                    reference={resource.coverageArea}
                    name='Coverage Area'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='coverage-area'
                />
            }
            {
                resource.serviceProvisionCode &&
                <Partials.CodeableConcept
                    codeableConcept={resource.serviceProvisionCode}
                    name='Service Provision Code'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='service-provision-code'
                />
            }
            {
                resource.program &&
                <Partials.CodeableConcept
                    codeableConcept={resource.program}
                    name='Program'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='program'
                />
            }
            {
                resource.characteristic &&
                <Partials.CodeableConcept
                    codeableConcept={resource.characteristic}
                    name='Characteristic'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='characteristic'
                />
            }
            {
                resource.communication &&
                <Partials.CodeableConcept
                    codeableConcept={resource.communication}
                    name='Communication'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='communication'
                />
            }
            {
                resource.referralMethod &&
                <Partials.CodeableConcept
                    codeableConcept={resource.referralMethod}
                    name='Referral Method'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='referral-method'
                />
            }
            {
                resource.appointmentRequired &&
                <Partials.Boolean
                    boolean={resource.appointmentRequired}
                    name='Appointment Required'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='appointment-required'
                />
            }
            {
                resource.endpoint &&
                <Partials.Reference
                    reference={resource.endpoint}
                    name='Endpoint'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='endpoint'
                />
            }
            <Typography variant="h4" sx={{ mt: 1 }}>
                Related Resources
            </Typography>
            <Partials.ReverseReference
                name="Practitioner Role"
                id={resource.id}
                resourceType={resource.resourceType}
                reverseReferences={[{'target': 'PractitionerRole', 'property': 'actor'}]}
            />
            <Partials.ReverseReference
                name="Schedule"
                id={resource.id}
                resourceType={resource.resourceType}
                reverseReferences={[{'target': 'Schedule', 'property': 'healthcareService'}]}
            />
        </>
    );
};

export default HealthcareService;
