/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
Goal
    Describes the intended objective(s) for a patient, group or organization care,
    for example, weight loss, restoring an activity of daily living, obtaining
    herd immunity via immunization, meeting a process improvement objective, etc.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const Goal = ({ resource }) => {
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
      {resource.lifecycleStatus && (
        <Partials.Code
          code={resource.lifecycleStatus}
          name="Lifecycle Status"
        />
      )}
      {resource.achievementStatus && (
        <Partials.CodeableConcept
          codeableConcept={resource.achievementStatus}
          name="Achievement Status"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="achievement-status"
        />
      )}
      {resource.category && (
        <Partials.CodeableConcept
          codeableConcept={resource.category}
          name="Category"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="category"
        />
      )}
      {resource.priority && (
        <Partials.CodeableConcept
          codeableConcept={resource.priority}
          name="Priority"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="priority"
        />
      )}
      {resource.description && (
        <Partials.CodeableConcept
          codeableConcept={resource.description}
          name="Description"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="description"
        />
      )}
      {resource.subject && (
        <Partials.Reference
          reference={resource.subject}
          name="Subject"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="subject"
        />
      )}
      {resource.startCodeableConcept && (
        <Partials.CodeableConcept
          codeableConcept={resource.startCodeableConcept}
          name="Start Codeable Concept"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="start-codeable-concept"
        />
      )}
      {resource.expressedBy && (
        <Partials.Reference
          reference={resource.expressedBy}
          name="Expressed By"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="expressed-by"
        />
      )}
      {resource.addresses && (
        <Partials.Reference
          reference={resource.addresses}
          name="Addresses"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="addresses"
        />
      )}
      {resource.note && (
        <Partials.Annotation
          annotation={resource.note}
          name="Note"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="note"
        />
      )}
      {resource.outcomeCode && (
        <Partials.CodeableConcept
          codeableConcept={resource.outcomeCode}
          name="Outcome Code"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="outcome-code"
        />
      )}
      {resource.outcomeReference && (
        <Partials.Reference
          reference={resource.outcomeReference}
          name="Outcome Reference"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="outcome-reference"
        />
      )}
    </>
  );
};

export default Goal;
