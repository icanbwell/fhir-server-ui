import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Buffer } from 'buffer';
import { TBaseResourceProps } from '../types/baseTypes';
import { TAttachment } from '../types/partials/Attachment';

type TAttachmentProps = TBaseResourceProps & {
  attachment: TAttachment|TAttachment[]|undefined;
};

const Attachment = ({ attachment, name }: TAttachmentProps) => {
  const [items, setItems] = useState<TAttachment[]>([]);

  useEffect(() => {
    if (attachment && !Array.isArray(attachment)) {
      setItems([attachment]);
    } else if (attachment) {
      setItems(attachment);
    }
  }, [attachment]);

  if (!attachment) {
    return <></>;
  }
  const asciiToString = (ascii: String|undefined) => {
    if (!ascii) {
      return '';
    }
    const bytes = new Uint8Array(ascii.length);
    for (let i = 0; i < ascii.length; i++) {
      bytes[`${i}`] = ascii.charCodeAt(i);
    }
    return Buffer.from(bytes.buffer).toString('base64');
  };

  return (
    <>
      {items &&
        items.length > 0 &&
        items[0] &&
        items.map((item: TAttachment, index: Number) => (
          <>
            {name && <Typography><b>{name}:</b></Typography>}
            <Accordion key={`${index}`}>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls={`panel${index}-content`}
                id={`panel${index}-header`}
              >
                <Typography>Content: {item.contentType}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box component="pre">
                  <Box component="code">{asciiToString(item.data)}</Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          </>
        ))}
    </>
  );
};

export default Attachment;
