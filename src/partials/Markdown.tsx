import { Typography, Box } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TMarkdown } from '../types/simpleTypes/Markdown';

type TMarkdownProps = TBaseResourceProps & {
  markdown: TMarkdown|TMarkdown[]|undefined;
};

const Markdown = ({ name, markdown }: TMarkdownProps) => {
  if (markdown && !Array.isArray(markdown)) {
    markdown = [markdown];
  }
  if (markdown !== undefined) {
    return (
      <Box>
        {markdown.map((value: TMarkdown) => (
          <Typography variant="body1" component="div">
            <b>{name}:</b>&nbsp;{value}
          </Typography>
        ))}
      </Box>
    );
  }
  return null;
};

export default Markdown;
