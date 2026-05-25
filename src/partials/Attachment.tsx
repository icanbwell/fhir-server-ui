import { useMemo } from 'react';
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

type TAttachmentProps = TBaseResourceProps & {
  attachment: TAttachment|TAttachment[]|undefined;
};

const Attachment = ({ attachment, name }: TAttachmentProps) => {
  const items = useMemo(() => {
    if (!attachment) {
      return [];
    }
    return Array.isArray(attachment) ? attachment : [attachment];
  }, [attachment]);

  if (!attachment) {
    return <></>;
  }
  const asciiToString = (ascii: String|undefined) => {
    if (!ascii) {
      return '';
    }
    return btoa(String(ascii));
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
