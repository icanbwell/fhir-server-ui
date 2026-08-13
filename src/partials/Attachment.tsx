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
import { ATTACHMENT_PARTIAL_RESOURCE_TYPES } from '../components/DocumentViewer';

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

  if (!attachment) {
    return <></>;
  }

  const documentViewerResourceType = ATTACHMENT_PARTIAL_RESOURCE_TYPES.find(
    (supported) => supported === String(resourceType)
  ) as TDocumentViewerResourceType | undefined;

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
