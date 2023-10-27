/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
ConceptMap
    A statement of relationships from one set of concepts to one or more other
    concepts - either concepts in code systems, or data element/data element
    concepts, or classes in class models.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const ConceptMap = ({ resource }) => {
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
      {resource.url && (
        <Partials.Uri
          uri={resource.url}
          name="Url"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="url"
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
      {resource.status && (
        <Partials.Code code={resource.status} name="Status" />
      )}
      {resource.experimental && (
        <Partials.Boolean
          boolean={resource.experimental}
          name="Experimental"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="experimental"
        />
      )}
      {resource.date && (
        <Partials.DateTime
          dateTime={resource.date}
          name="Date"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="date"
        />
      )}
      {resource.description && (
        <Partials.Markdown
          markdown={resource.description}
          name="Description"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="description"
        />
      )}
      {resource.jurisdiction && (
        <Partials.CodeableConcept
          codeableConcept={resource.jurisdiction}
          name="Jurisdiction"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="jurisdiction"
        />
      )}
      {resource.purpose && (
        <Partials.Markdown
          markdown={resource.purpose}
          name="Purpose"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="purpose"
        />
      )}
      {resource.copyright && (
        <Partials.Markdown
          markdown={resource.copyright}
          name="Copyright"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="copyright"
        />
      )}
      {resource.sourceUri && (
        <Partials.Uri
          uri={resource.sourceUri}
          name="Source Uri"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="source-uri"
        />
      )}
      {resource.sourceCanonical && (
        <Partials.Canonical
          canonical={resource.sourceCanonical}
          name="Source Canonical"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="source-canonical"
        />
      )}
      {resource.targetUri && (
        <Partials.Uri
          uri={resource.targetUri}
          name="Target Uri"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="target-uri"
        />
      )}
      {resource.targetCanonical && (
        <Partials.Canonical
          canonical={resource.targetCanonical}
          name="Target Canonical"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="target-canonical"
        />
      )}
    </>
  );
};

export default ConceptMap;
