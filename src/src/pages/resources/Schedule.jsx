/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
Schedule
    A container for slots of time that may be available for booking appointments.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const Schedule = ({ resource }) => {
  return (
    <>
      <Link
        title="Direct link to Resource"
        href={`/4_0_0/${resource.resourceType}/${resource.id}`}
      >
        {resource.resourceType}/{resource.id}
      </Link>
      {resource.meta && (
        <Partials.Meta
          meta={resource.meta}
          name="Meta"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="meta"
        />
      )}
      {resource.implicitRules && (
        <Partials.Uri
          uri={resource.implicitRules}
          name="Implicit Rules"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="implicit-rules"
        />
      )}
      {resource.language && (
        <Partials.Code code={resource.language} name="Language" />
      )}
      {resource.text && (
        <Partials.Narrative
          narrative={resource.text}
          name="Text"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="text"
        />
      )}
      {resource.extension && (
        <Partials.Extension
          extension={resource.extension}
          name="Extension"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="extension"
        />
      )}
      {resource.modifierExtension && (
        <Partials.Extension
          extension={resource.modifierExtension}
          name="Modifier Extension"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="modifier-extension"
        />
      )}
      {resource.identifier && (
        <Partials.Identifier
          identifier={resource.identifier}
          name="Identifier"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="identifier"
        />
      )}
      {resource.active && (
        <Partials.Boolean
          boolean={resource.active}
          name="Active"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="active"
        />
      )}
      {resource.serviceCategory && (
        <Partials.CodeableConcept
          codeableConcept={resource.serviceCategory}
          name="Service Category"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="service-category"
        />
      )}
      {resource.serviceType && (
        <Partials.CodeableConcept
          codeableConcept={resource.serviceType}
          name="Service Type"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="service-type"
        />
      )}
      {resource.specialty && (
        <Partials.CodeableConcept
          codeableConcept={resource.specialty}
          name="Specialty"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="specialty"
        />
      )}
      {resource.actor && (
        <Partials.Reference
          reference={resource.actor}
          name="Actor"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="actor"
        />
      )}
      {resource.planningHorizon && (
        <Partials.Period
          period={resource.planningHorizon}
          name="Planning Horizon"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="planning-horizon"
        />
      )}
    </>
  );
};

export default Schedule;
