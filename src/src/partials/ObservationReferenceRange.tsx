import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TObservationReferenceRange } from '../types/partials/ObservationReferenceRange';

type TObservationReferenceRangeProps = TBaseResourceProps & {
  observationReferenceRange: TObservationReferenceRange|TObservationReferenceRange[]|undefined;
};

const ObservationReferenceRange = ({
  observationReferenceRange: referenceRange,
  name,
}: TObservationReferenceRangeProps) => {
  if (!referenceRange) {
    return <></>;
  }
  referenceRange = Array.isArray(referenceRange)
    ? referenceRange
    : [referenceRange];
  return referenceRange && referenceRange.length > 0 && referenceRange[0] ? (
    <Box>
      <Typography variant="h4">{name}</Typography>
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>id</TableCell>
              <TableCell>low</TableCell>
              <TableCell>high</TableCell>
              <TableCell>text</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {referenceRange.map((range: TObservationReferenceRange, index: Number) =>
              range ? (
                <TableRow key={`${index}`}>
                  <TableCell>{range.id ? range.id : ''}</TableCell>
                  <TableCell>
                    {range.low && range.low.value
                      ? `${range.low.value}${
                          range.low.unit ? range.low.unit : ''
                        }`
                      : ''}
                  </TableCell>
                  <TableCell>
                    {range.high && range.high.value
                      ? `${range.high.value}${
                          range.high.unit ? range.high.unit : ''
                        }`
                      : ''}
                  </TableCell>
                  <TableCell>{range.text ? range.text : ''}</TableCell>
                </TableRow>
              ) : null,
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  ) : null;
};

export default ObservationReferenceRange;
