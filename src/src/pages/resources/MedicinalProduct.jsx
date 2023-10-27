/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
MedicinalProduct
    Detailed definition of a medicinal product, typically for uses other than
    direct patient care (e.g. regulatory use).
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const MedicinalProduct = ({ resource }) => {
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
      {resource.type && (
        <Partials.CodeableConcept
          codeableConcept={resource.type}
          name="Type"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="type"
        />
      )}
      {resource.domain && (
        <Partials.Coding
          coding={resource.domain}
          name="Domain"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="domain"
        />
      )}
      {resource.combinedPharmaceuticalDoseForm && (
        <Partials.CodeableConcept
          codeableConcept={resource.combinedPharmaceuticalDoseForm}
          name="Combined Pharmaceutical Dose Form"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="combined-pharmaceutical-dose-form"
        />
      )}
      {resource.legalStatusOfSupply && (
        <Partials.CodeableConcept
          codeableConcept={resource.legalStatusOfSupply}
          name="Legal Status Of Supply"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="legal-status-of-supply"
        />
      )}
      {resource.additionalMonitoringIndicator && (
        <Partials.CodeableConcept
          codeableConcept={resource.additionalMonitoringIndicator}
          name="Additional Monitoring Indicator"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="additional-monitoring-indicator"
        />
      )}
      {resource.paediatricUseIndicator && (
        <Partials.CodeableConcept
          codeableConcept={resource.paediatricUseIndicator}
          name="Paediatric Use Indicator"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="paediatric-use-indicator"
        />
      )}
      {resource.productClassification && (
        <Partials.CodeableConcept
          codeableConcept={resource.productClassification}
          name="Product Classification"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="product-classification"
        />
      )}
      {resource.pharmaceuticalProduct && (
        <Partials.Reference
          reference={resource.pharmaceuticalProduct}
          name="Pharmaceutical Product"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="pharmaceutical-product"
        />
      )}
      {resource.packagedMedicinalProduct && (
        <Partials.Reference
          reference={resource.packagedMedicinalProduct}
          name="Packaged Medicinal Product"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="packaged-medicinal-product"
        />
      )}
      {resource.attachedDocument && (
        <Partials.Reference
          reference={resource.attachedDocument}
          name="Attached Document"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="attached-document"
        />
      )}
      {resource.masterFile && (
        <Partials.Reference
          reference={resource.masterFile}
          name="Master File"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="master-file"
        />
      )}
      {resource.contact && (
        <Partials.Reference
          reference={resource.contact}
          name="Contact"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="contact"
        />
      )}
      {resource.clinicalTrial && (
        <Partials.Reference
          reference={resource.clinicalTrial}
          name="Clinical Trial"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="clinical-trial"
        />
      )}
      {resource.crossReference && (
        <Partials.Identifier
          identifier={resource.crossReference}
          name="Cross Reference"
          resourceType={resource.resourceType}
          id={resource.id}
          searchParameter="cross-reference"
        />
      )}
    </>
  );
};

export default MedicinalProduct;
