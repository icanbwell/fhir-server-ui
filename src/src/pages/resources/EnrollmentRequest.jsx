/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
EnrollmentRequest
    This resource provides the insurance enrollment details to the insurer
    regarding a specified coverage.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const EnrollmentRequest = ({ resource }) => {
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
      {resource.status && (
        <Partials.Code code={resource.status} name="Status" />
      )}
      {resource.created && (
        <Partials.DateTime
          dateTime={resource.created}
          name="Created"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="created"
        />
      )}
      {resource.insurer && (
        <Partials.Reference
          reference={resource.insurer}
          name="Insurer"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="insurer"
        />
      )}
      {resource.provider && (
        <Partials.Reference
          reference={resource.provider}
          name="Provider"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="provider"
        />
      )}
      {resource.candidate && (
        <Partials.Reference
          reference={resource.candidate}
          name="Candidate"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="candidate"
        />
      )}
      {resource.coverage && (
        <Partials.Reference
          reference={resource.coverage}
          name="Coverage"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="coverage"
        />
      )}
    </>
  );
};

export default EnrollmentRequest;
