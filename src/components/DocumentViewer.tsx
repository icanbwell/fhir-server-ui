import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Typography } from '@mui/material';
import AttachmentPreview from './AttachmentPreview';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import BaseApi from '../api/baseApi';
import { TAttachment } from '../types/partials/Attachment';
import { TDocumentViewerResourceType } from '../partials/DocumentViewerLink';

interface DocumentViewerProps {
    relativeUrl: string;
    // Isolates this one attachment entry instead of stacking all of them. DocumentViewerPage
    // defaults this to 0 when the URL carries no explicit index, so undefined here only occurs
    // for a non-numeric trailing path segment (a real FHIR sub-operation) — in which case every
    // entry is shown, since no single one was requested.
    contentIndex?: number;
}

interface FhirResource {
    resourceType?: string;
    id?: string;
    contentType?: string;
    data?: string;
    [key: string]: unknown;
}

// Every resource type the Document Viewer supports, other than Binary (handled as its own
// special case below, since it IS the fetched resource rather than a field on it), carries its
// attachment(s) in exactly one field, in one of three shapes:
//  - 'wrapped-array': entries are `{ attachment: TAttachment }` (DocumentReference.content)
//  - 'bare-array': entries are TAttachment directly (DiagnosticReport.presentedForm, *.photo)
//  - 'single': the field itself is one TAttachment, not an array (Media.content, etc.)
type TAttachmentFieldShape = 'wrapped-array' | 'bare-array' | 'single';

type TAttachmentFieldConfig = {
    field: string;
    shape: TAttachmentFieldShape;
};

const ATTACHMENT_FIELD_BY_RESOURCE_TYPE: Record<
    Exclude<TDocumentViewerResourceType, 'Binary'>,
    TAttachmentFieldConfig
> = {
    DocumentReference: { field: 'content', shape: 'wrapped-array' },
    DiagnosticReport: { field: 'presentedForm', shape: 'bare-array' },
    Media: { field: 'content', shape: 'single' },
    Patient: { field: 'photo', shape: 'bare-array' },
    Practitioner: { field: 'photo', shape: 'bare-array' },
    RelatedPerson: { field: 'photo', shape: 'bare-array' },
    Consent: { field: 'sourceAttachment', shape: 'single' },
    Contract: { field: 'legallyBindingAttachment', shape: 'single' },
};

// Derived (not hand-listed) so it can never drift from ATTACHMENT_FIELD_BY_RESOURCE_TYPE above —
// consumed by Attachment.tsx to decide which resource types get a "View in Document Viewer" link.
export const ATTACHMENT_PARTIAL_RESOURCE_TYPES = (
    Object.keys(ATTACHMENT_FIELD_BY_RESOURCE_TYPE) as Exclude<TDocumentViewerResourceType, 'Binary'>[]
).filter((resourceType) => resourceType !== 'DocumentReference');

const isSupportedResourceType = (resourceType: string | undefined): resourceType is TDocumentViewerResourceType =>
    resourceType === 'Binary' ||
    Object.prototype.hasOwnProperty.call(ATTACHMENT_FIELD_BY_RESOURCE_TYPE, resourceType ?? '');

const extractAttachments = (resource: FhirResource, config: TAttachmentFieldConfig): TAttachment[] => {
    const raw = resource[config.field];
    if (!raw) {
        return [];
    }
    if (config.shape === 'single') {
        return [raw as TAttachment];
    }
    // Defensive: 0..* fields (photo, presentedForm) are occasionally sent by non-conformant
    // servers as a single object instead of an array. Normalize either shape to an array so
    // the render below (which always maps over an array) never throws.
    const list = Array.isArray(raw) ? raw : [raw];
    return config.shape === 'wrapped-array'
        ? (list as Array<{ attachment: TAttachment }>).map((entry) => entry.attachment)
        : (list as TAttachment[]);
};

const DocumentViewer: React.FC<DocumentViewerProps> = ({ relativeUrl, contentIndex }) => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const baseApi = useMemo(() => new BaseApi({ fhirUrl, setUserDetails }), [fhirUrl, setUserDetails]);

    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [resource, setResource] = useState<FhirResource | null>(null);

    useEffect(() => {
        let cancelled = false;
        setIsLoading(true);
        setErrorMessage(null);
        baseApi
            .getData({ urlString: relativeUrl })
            .then(({ json }) => {
                if (cancelled) {
                    return;
                }
                if (isSupportedResourceType(json?.resourceType)) {
                    setResource(json);
                } else {
                    setErrorMessage(`The Document Viewer does not support resource type "${json?.resourceType}".`);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setErrorMessage('Failed to load the resource.');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });
        return () => {
            cancelled = true;
        };
    }, [relativeUrl, baseApi]);

    if (isLoading) {
        return <Typography color="text.secondary">Loading…</Typography>;
    }
    if (errorMessage || !resource) {
        return <Alert severity="error">{errorMessage || 'Resource not found.'}</Alert>;
    }

    if (resource.resourceType === 'Binary') {
        // No title here: the heading below already reads "Binary/{id}" — repeating it as
        // AttachmentPreview's own subtitle would just duplicate the same text, and using it as
        // a download filename (which AttachmentPreview falls back to when title is unset) would
        // put a literal "/" in the suggested filename.
        const attachment: TAttachment = {
            contentType: resource.contentType,
            data: resource.data,
            url: resource.data ? undefined : `Binary/${resource.id}`,
        };
        return (
            <Box>
                <Typography variant="h5" sx={{ mb: 2 }}>
                    {`Binary/${resource.id}`}
                </Typography>
                <AttachmentPreview attachment={attachment} />
            </Box>
        );
    }

    const config = ATTACHMENT_FIELD_BY_RESOURCE_TYPE[resource.resourceType as Exclude<TDocumentViewerResourceType, 'Binary'>];
    const attachments = extractAttachments(resource, config);
    // Isolate the requested entry when its index is valid; otherwise (no index given, or a
    // stale/out-of-range one) fall back to showing every entry rather than a dead end.
    // contentIndex is a regex-validated (\d+) number from the URL, used only as an array index.
    // eslint-disable-next-line security/detect-object-injection
    const isolated = contentIndex !== undefined ? attachments[contentIndex] : undefined;
    const entriesToShow = isolated ? [isolated] : attachments;

    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>
                {`${resource.resourceType}/${resource.id}`}
                {isolated && attachments.length > 1 ? ` — content ${contentIndex! + 1} of ${attachments.length}` : ''}
            </Typography>
            {attachments.length === 0 && (
                <Alert severity="warning">This {resource.resourceType} has no attachment entries.</Alert>
            )}
            {!isolated && contentIndex !== undefined && attachments.length > 0 && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Content entry {contentIndex + 1} was requested but no longer exists — showing all entries
                    instead.
                </Alert>
            )}
            {entriesToShow.map((attachment, index) => (
                <AttachmentPreview key={isolated ? contentIndex : index} attachment={attachment} />
            ))}
        </Box>
    );
};

export default DocumentViewer;
