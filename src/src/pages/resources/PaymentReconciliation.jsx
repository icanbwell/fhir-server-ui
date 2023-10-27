/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
PaymentReconciliation
    This resource provides the details including amount of a payment and allocates
    the payment items being paid.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const PaymentReconciliation = ({ resource }) => {
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
      {resource.period && (
        <Partials.Period
          period={resource.period}
          name="Period"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="period"
        />
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
      {resource.paymentIssuer && (
        <Partials.Reference
          reference={resource.paymentIssuer}
          name="Payment Issuer"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="payment-issuer"
        />
      )}
      {resource.request && (
        <Partials.Reference
          reference={resource.request}
          name="Request"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="request"
        />
      )}
      {resource.requestor && (
        <Partials.Reference
          reference={resource.requestor}
          name="Requestor"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="requestor"
        />
      )}
      {resource.outcome && (
        <Partials.Code code={resource.outcome} name="Outcome" />
      )}
      {resource.paymentIdentifier && (
        <Partials.Identifier
          identifier={resource.paymentIdentifier}
          name="Payment Identifier"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="payment-identifier"
        />
      )}
      {resource.formCode && (
        <Partials.CodeableConcept
          codeableConcept={resource.formCode}
          name="Form Code"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="form-code"
        />
      )}
    </>
  );
};

export default PaymentReconciliation;
