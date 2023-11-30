/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
DiagnosticReport
    The findings and interpretation of diagnostic  tests performed on patients,
    groups of patients, devices, and locations, and/or specimens derived from
    these. The report includes clinical context such as requesting and provider
    information, and some mix of atomic results, images, textual and coded
    interpretations, and formatted representation of diagnostic reports.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';
import { TDiagnosticReport } from '../../types/resources/DiagnosticReport';

// Import all the partial resource
import Partials from '../../partials';

const DiagnosticReport = ({ resource }: { resource: TDiagnosticReport }): React.ReactElement => {
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
                resource.basedOn &&
                <Partials.Reference
                    reference={resource.basedOn}
                    name='Based On'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='based-on'
                />
            }
            {
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
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
                resource.code &&
                <Partials.CodeableConcept
                    codeableConcept={resource.code}
                    name='Code'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='code'
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
                resource.encounter &&
                <Partials.Reference
                    reference={resource.encounter}
                    name='Encounter'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='encounter'
                />
            }
            {
                resource.effectiveDateTime &&
                <Partials.DateTime
                    dateTime={resource.effectiveDateTime}
                    name='Effective Date Time'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='effective-date-time'
                />
            }
            {
                resource.effectivePeriod &&
                <Partials.Period
                    period={resource.effectivePeriod}
                    name='Effective Period'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='effective-period'
                />
            }
            {
                resource.issued &&
                <Partials.Instant
                    instant={resource.issued}
                    name='Issued'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='issued'
                />
            }
            {
                resource.performer &&
                <Partials.Reference
                    reference={resource.performer}
                    name='Performer'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='performer'
                />
            }
            {
                resource.resultsInterpreter &&
                <Partials.Reference
                    reference={resource.resultsInterpreter}
                    name='Results Interpreter'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='results-interpreter'
                />
            }
            {
                resource.specimen &&
                <Partials.Reference
                    reference={resource.specimen}
                    name='Specimen'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='specimen'
                />
            }
            {
                resource.result &&
                <Partials.Reference
                    reference={resource.result}
                    name='Result'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='result'
                />
            }
            {
                resource.imagingStudy &&
                <Partials.Reference
                    reference={resource.imagingStudy}
                    name='Imaging Study'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='imaging-study'
                />
            }
            {
                resource.conclusionCode &&
                <Partials.CodeableConcept
                    codeableConcept={resource.conclusionCode}
                    name='Conclusion Code'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='conclusion-code'
                />
            }
            {
                resource.presentedForm &&
                <Partials.Attachment
                    attachment={resource.presentedForm}
                    name='Presented Form'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='presented-form'
                />
            }
        </>
    );
};

export default DiagnosticReport;
