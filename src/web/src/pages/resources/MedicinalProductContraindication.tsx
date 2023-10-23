/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
MedicinalProductContraindication
    The clinical particulars - indications, contraindications etc. of a medicinal
    product, including for regulatory purposes.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import {Link} from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const MedicinalProductContraindication: React.FC<any> = ({ resource }: any) => {
    return (
        <>
            <Link title="Direct link to Resource" href={`/4_0_0/${resource.resourceType}/${resource.id}`}>
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
                resource.language&&
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
                resource.subject &&
                <Partials.Reference
                    reference={resource.subject}
                    name='Subject'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='subject'
                />
            }
            {
                resource.disease &&
                <Partials.CodeableConcept
                    codeableConcept={resource.disease}
                    name='Disease'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='disease'
                />
            }
            {
                resource.diseaseStatus &&
                <Partials.CodeableConcept
                    codeableConcept={resource.diseaseStatus}
                    name='Disease Status'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='disease-status'
                />
            }
            {
                resource.comorbidity &&
                <Partials.CodeableConcept
                    codeableConcept={resource.comorbidity}
                    name='Comorbidity'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='comorbidity'
                />
            }
            {
                resource.therapeuticIndication &&
                <Partials.Reference
                    reference={resource.therapeuticIndication}
                    name='Therapeutic Indication'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='therapeutic-indication'
                />
            }
        </>
    );
};

export default MedicinalProductContraindication;