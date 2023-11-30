/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
SearchParameter
    A search parameter that defines a named search item that can be used to
    search/filter on a resource.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import { Link } from '@mui/material';
import { TSearchParameter } from '../../types/resources/SearchParameter';

// Import all the partial resource
import Partials from '../../partials';

const SearchParameter = ({ resource }: { resource: TSearchParameter }): React.ReactElement => {
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
                resource.url &&
                <Partials.Uri
                    uri={resource.url}
                    name='Url'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='url'
                />
            }
            {
                resource.derivedFrom &&
                <Partials.Canonical
                    canonical={resource.derivedFrom}
                    name='Derived From'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='derived-from'
                />
            }
            {
                resource.status &&
                <Partials.Code code={resource.status} name='Status'/>
            }
            {
                resource.experimental &&
                <Partials.Boolean
                    boolean={resource.experimental}
                    name='Experimental'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='experimental'
                />
            }
            {
                resource.date &&
                <Partials.DateTime
                    dateTime={resource.date}
                    name='Date'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='date'
                />
            }
            {
                resource.description &&
                <Partials.Markdown
                    markdown={resource.description}
                    name='Description'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='description'
                />
            }
            {
                resource.jurisdiction &&
                <Partials.CodeableConcept
                    codeableConcept={resource.jurisdiction}
                    name='Jurisdiction'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='jurisdiction'
                />
            }
            {
                resource.purpose &&
                <Partials.Markdown
                    markdown={resource.purpose}
                    name='Purpose'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='purpose'
                />
            }
            {
                resource.code &&
                <Partials.Code code={resource.code} name='Code'/>
            }
            {
                resource.base &&
                <Partials.Code code={resource.base} name='Base'/>
            }
            {
                resource.type &&
                <Partials.Code code={resource.type} name='Type'/>
            }
            {
                resource.xpathUsage &&
                <Partials.Code code={resource.xpathUsage} name='Xpath Usage'/>
            }
            {
                resource.target &&
                <Partials.Code code={resource.target} name='Target'/>
            }
            {
                resource.multipleOr &&
                <Partials.Boolean
                    boolean={resource.multipleOr}
                    name='Multiple Or'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='multiple-or'
                />
            }
            {
                resource.multipleAnd &&
                <Partials.Boolean
                    boolean={resource.multipleAnd}
                    name='Multiple And'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='multiple-and'
                />
            }
            {
                resource.comparator &&
                <Partials.Code code={resource.comparator} name='Comparator'/>
            }
            {
                resource.modifier &&
                <Partials.Code code={resource.modifier} name='Modifier'/>
            }
        </>
    );
};

export default SearchParameter;
