/* eslint-disable no-unused-vars */
/* eslint-disable no-trailing-spaces */
// This file is auto-generated by generate_classes so do not edit manually

/**
Binary
    A resource that represents the data of a single raw artifact as digital
    content accessible in its native format.  A Binary resource can contain any
    content, whether text, image, pdf, zip archive, etc.
    If the element is present, it must have either a @value, an @id, or extensions
*/

import React from 'react';
import {Link} from '@mui/material';

// Import all the partial resource
import Partials from '../../partials';

const Binary = ({ resource }) => {
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
                resource.contentType &&
                <Partials.Code code={resource.contentType} name='Content Type'/>
            }
            {
                resource.securityContext &&
                <Partials.Reference
                    reference={resource.securityContext}
                    name='Security Context'
                    resourceType={resource.resourceType}
                    id={resource.id}
                    searchParameter='security-context'
                />
            }
        </>
    );
};

export default Binary;
