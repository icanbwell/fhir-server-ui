import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
} from '@mui/material';
import { TAnnotation } from '../types/partials/Annotation';
import { TBaseResourceProps } from '../types/baseTypes';

type TAnnotationProps = TBaseResourceProps & {
  annotation: TAnnotation|TAnnotation[]|undefined;
};

const Annotation = ({ annotation: annotations }: TAnnotationProps) => {
  if (!annotations) {
    return <></>;
  }
  // Check if annotations is not an array and convert it to an array
  let normalizedAnnotations = Array.isArray(annotations)
    ? annotations
    : [annotations];

  // Filter out any null or undefined annotations
  normalizedAnnotations = normalizedAnnotations.filter(
    (annotation) => !!annotation,
  );

  if (normalizedAnnotations.length === 0) {
    return null;
  }

  return (
    <Box>
      <Typography variant="h4">Names</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Author</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Text</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {normalizedAnnotations.map((annotation: TAnnotation, index: Number) => (
              <TableRow key={`${index}`}>
                <TableCell>
                  {annotation.authorReference
                    ? annotation.authorReference.reference
                    : annotation.authorString}
                </TableCell>
                <TableCell>{annotation.time}</TableCell>
                <TableCell>{annotation.text}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Annotation;
