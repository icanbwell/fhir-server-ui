import {
    Box, Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TExtension } from '../types/partials/Extension';

type TExtensionProps = TBaseResourceProps & {
  extension: TExtension|TExtension[]|undefined;
}

const Extension = ({ extension: extensions }: TExtensionProps) => {
  if (!extensions) {
    return null;
  }
  // Ensure `extensions` is an array
  if (!Array.isArray(extensions)) {
    extensions = [extensions];
  }
  return extensions && extensions.length > 0 && extensions[0] ? (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>Extension</Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Id</TableCell>
              <TableCell>Url</TableCell>
              <TableCell>Detail Url</TableCell>
              <TableCell>Value</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {extensions.map((extension, index) => {
              if (extension && extension.extension) {
                return extension.extension
                  .filter((e) => e)
                  .map((detailExtension, detailIndex) => {
                    return (
                      <TableRow key={`${index}.${detailIndex}`}>
                        <TableCell>{extension.id}</TableCell>
                        <TableCell>{extension.url}</TableCell>
                        <TableCell>{detailExtension.url}</TableCell>
                        <TableCell>
                          {detailExtension.valueCodeableConcept?.coding
                            ? `${detailExtension.valueCodeableConcept.coding[0].code || ''} (${detailExtension.valueCodeableConcept.text || ''})`
                            : detailExtension.valueRange?.low && detailExtension.valueRange?.high
                            ? `${detailExtension.valueRange.low.value || ''} ${detailExtension.valueRange.low.unit || ''} to ${detailExtension.valueRange.high.value || ''} ${detailExtension.valueRange.high.unit || ''}`
                            : `${detailExtension.valueString || ''}${detailExtension.valueDateTime || ''}${detailExtension.valueUri || ''}`}
                        </TableCell>
                      </TableRow>
                    );
                  });
              } else if (extension) {
                return (
                  <TableRow key={index}>
                    <TableCell>{extension.id}</TableCell>
                    <TableCell>{extension.url}</TableCell>
                    <TableCell></TableCell>
                    <TableCell>
                      {extension.valueCodeableConcept?.coding
                        ? `${extension.valueCodeableConcept.coding[0].code || ''} (${extension.valueCodeableConcept.text || ''})`
                        : `${extension.valueString || ''}${extension.valueDateTime || ''}${extension.valueUri || ''}`}
                    </TableCell>
                  </TableRow>
                );
              } else {
                return <span key={index}></span>;
              }
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  ) : null;
};

export default Extension;
