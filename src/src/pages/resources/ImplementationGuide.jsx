/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
ImplementationGuide
    A set of rules of how a particular interoperability or standards problem is
    solved - typically through the use of FHIR resources. This resource is used to
    gather all the parts of an implementation guide into a logical whole and to
    publish a computable definition of all the parts.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const ImplementationGuide = ({ resource }) => {
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
      {resource.copyright && (
        <Partials.Markdown
          markdown={resource.copyright}
          name="Copyright"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="copyright"
        />
      )}
      {resource.license && (
        <Partials.Code code={resource.license} name="License" />
      )}
      {resource.fhirVersion && (
        <Partials.Code code={resource.fhirVersion} name="Fhir Version" />
      )}
    </>
  );
};

export default ImplementationGuide;
