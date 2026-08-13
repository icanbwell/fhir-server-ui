import React, { useMemo } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TBaseResourceProps } from '../types/baseTypes';
import { TAttachment } from '../types/partials/Attachment';
import DocumentViewerLink, { TDocumentViewerResourceType } from './DocumentViewerLink';

// Resource types whose attachment-bearing field renders through this shared partial and is
// also viewable via the Document Viewer. DocumentReference.content and Binary go through their
// own dedicated partial/route instead (see DocumentContent.tsx), so they're deliberately not
// listed here — this partial never receives those two.
const DOCUMENT_VIEWER_RESOURCE_TYPES: ReadonlyArray<TDocumentViewerResourceType> = [
    'DiagnosticReport',
    'Media',
    'Patient',
    'Practitioner',
    'RelatedPerson',
    'Consent',
    'Contract',
];

type TAttachmentProps = TBaseResourceProps & {
  attachment: TAttachment|TAttachment[]|undefined;
};

const Attachment = ({ attachment, name, resourceType, id }: TAttachmentProps) => {
  const items = useMemo(() => {
    if (!attachment) {
      return [];
    }
    return Array.isArray(attachment) ? attachment : [attachment];
  }, [attachment]);

  const documentViewerResourceType = DOCUMENT_VIEWER_RESOURCE_TYPES.find(
    (supported) => supported === (resourceType as TDocumentViewerResourceType)
  ) as TDocumentViewerResourceType | undefined;

  if (!attachment) {
    return <></>;
  }
  const isTextContentType = (contentType: String|undefined) => {
    if (!contentType) {
      return false;
    }
    const ct = String(contentType).toLowerCase().split(';')[0].trim();
    return (
      ct.startsWith('text/') ||
      ct === 'application/json' ||
      ct === 'application/xml' ||
      ct === 'application/fhir+json' ||
      ct === 'application/fhir+xml'
    );
  };

  const renderAttachmentData = (item: TAttachment) => {
    if (!item.data) {
      return '';
    }
    if (!isTextContentType(item.contentType)) {
      return String(item.data);
    }
    try {
      const bytes = Uint8Array.from(
        atob(String(item.data).replace(/\s/g, '')),
        (c) => c.charCodeAt(0)
      );
      return new TextDecoder().decode(bytes);
    } catch (decodeError) {
      console.warn('Failed to decode Attachment.data as base64', decodeError);
      return String(item.data);
    }
  };

  return (
    <>
      {items &&
        items.length > 0 &&
        items[0] &&
        items.map((item: TAttachment, index: Number) => (
          <React.Fragment key={`${index}`}>
            {name && <Typography><b>{name}:</b></Typography>}
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel${index}-content`}
                id={`panel${index}-header`}
              >
                <Typography>Content: {item.contentType}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                {documentViewerResourceType && (
                  <Box sx={{ mb: 1 }}>
                    <DocumentViewerLink
                      resourceType={documentViewerResourceType}
                      id={id}
                      contentIndex={items.length > 1 ? Number(index) : undefined}
                    />
                  </Box>
                )}
                <Box component="pre">
                  <Box component="code">{renderAttachmentData(item)}</Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </React.Fragment>
        ))}
    </>
  );
};

export default Attachment;
