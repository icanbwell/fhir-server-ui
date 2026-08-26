import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TImagingStudySeries } from '../types/partials/ImagingStudySeries';
import Coding from './Coding';
import DateTime from './DateTime';

type TImagingStudySeriesProps = TBaseResourceProps & {
  field?: string;
  series: TImagingStudySeries | TImagingStudySeries[] | undefined;
};

const ImagingStudySeriesField = ({ series, name, resourceType }: TImagingStudySeriesProps) => {
  if (!series) {
    return null;
  }
  const values = Array.isArray(series) ? series : [series];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          <Typography component="div"><b>UID:</b>&nbsp;{value.uid}</Typography>
          {value.number !== undefined && <Typography component="div"><b>Number:</b>&nbsp;{`${value.number}`}</Typography>}
          {value.description && <Typography component="div"><b>Description:</b>&nbsp;{value.description}</Typography>}
          {value.numberOfInstances !== undefined && (
            <Typography component="div"><b>Number of Instances:</b>&nbsp;{`${value.numberOfInstances}`}</Typography>
          )}
          <Coding coding={value.modality} name="Modality" resourceType={resourceType} />
          <Coding coding={value.bodySite} name="Body Site" resourceType={resourceType} />
          <Coding coding={value.laterality} name="Laterality" resourceType={resourceType} />
          <DateTime dateTime={value.started} name="Started" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default ImagingStudySeriesField;
