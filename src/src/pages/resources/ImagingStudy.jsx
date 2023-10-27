/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
ImagingStudy
    Representation of the content produced in a DICOM imaging study. A study
    comprises a set of series, each of which includes a set of Service-Object Pair
    Instances (SOP Instances - images or other data) acquired or produced in a
    common context.  A series is of only one modality (e.g. X-ray, CT, MR,
    ultrasound), but a study may have multiple series of different modalities.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const ImagingStudy = ({ resource }) => {
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
      {resource.modality && (
        <Partials.Coding
          coding={resource.modality}
          name="Modality"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="modality"
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
      {resource.encounter && (
        <Partials.Reference
          reference={resource.encounter}
          name="Encounter"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="encounter"
        />
      )}
      {resource.started && (
        <Partials.DateTime
          dateTime={resource.started}
          name="Started"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="started"
        />
      )}
      {resource.basedOn && (
        <Partials.Reference
          reference={resource.basedOn}
          name="Based On"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="based-on"
        />
      )}
      {resource.referrer && (
        <Partials.Reference
          reference={resource.referrer}
          name="Referrer"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="referrer"
        />
      )}
      {resource.interpreter && (
        <Partials.Reference
          reference={resource.interpreter}
          name="Interpreter"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="interpreter"
        />
      )}
      {resource.endpoint && (
        <Partials.Reference
          reference={resource.endpoint}
          name="Endpoint"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="endpoint"
        />
      )}
      {resource.procedureReference && (
        <Partials.Reference
          reference={resource.procedureReference}
          name="Procedure Reference"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="procedure-reference"
        />
      )}
      {resource.procedureCode && (
        <Partials.CodeableConcept
          codeableConcept={resource.procedureCode}
          name="Procedure Code"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="procedure-code"
        />
      )}
      {resource.location && (
        <Partials.Reference
          reference={resource.location}
          name="Location"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="location"
        />
      )}
      {resource.reasonCode && (
        <Partials.CodeableConcept
          codeableConcept={resource.reasonCode}
          name="Reason Code"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="reason-code"
        />
      )}
      {resource.reasonReference && (
        <Partials.Reference
          reference={resource.reasonReference}
          name="Reason Reference"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="reason-reference"
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
    </>
  );
};

export default ImagingStudy;
