import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TVisionPrescriptionLensSpecification } from '../types/partials/VisionPrescriptionLensSpecification';
import CodeableConcept from './CodeableConcept';
import Quantity from './Quantity';
import Annotation from './Annotation';

type TVisionPrescriptionLensSpecificationProps = TBaseResourceProps & {
  field?: string;
  lensSpecification: TVisionPrescriptionLensSpecification | TVisionPrescriptionLensSpecification[] | undefined;
};

const VisionPrescriptionLensSpecification = ({
  lensSpecification,
  name,
  resourceType,
}: TVisionPrescriptionLensSpecificationProps) => {
  if (!lensSpecification) {
    return null;
  }
  const values = Array.isArray(lensSpecification) ? lensSpecification : [lensSpecification];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          <CodeableConcept codeableConcept={value.product} name="Product" resourceType={resourceType} />
          {value.eye !== undefined && (
            <Typography component="div"><b>Eye:</b>&nbsp;{value.eye}</Typography>
          )}
          {value.sphere !== undefined && (
            <Typography component="div"><b>Sphere:</b>&nbsp;{`${value.sphere}`}</Typography>
          )}
          {value.cylinder !== undefined && (
            <Typography component="div"><b>Cylinder:</b>&nbsp;{`${value.cylinder}`}</Typography>
          )}
          {value.axis !== undefined && (
            <Typography component="div"><b>Axis:</b>&nbsp;{`${value.axis}`}</Typography>
          )}
          {value.add !== undefined && (
            <Typography component="div"><b>Add:</b>&nbsp;{`${value.add}`}</Typography>
          )}
          {value.power !== undefined && (
            <Typography component="div"><b>Power:</b>&nbsp;{`${value.power}`}</Typography>
          )}
          {value.backCurve !== undefined && (
            <Typography component="div"><b>Back Curve:</b>&nbsp;{`${value.backCurve}`}</Typography>
          )}
          {value.diameter !== undefined && (
            <Typography component="div"><b>Diameter:</b>&nbsp;{`${value.diameter}`}</Typography>
          )}
          <Quantity quantity={value.duration} name="Duration" resourceType={resourceType} />
          {value.color !== undefined && (
            <Typography component="div"><b>Color:</b>&nbsp;{value.color}</Typography>
          )}
          {value.brand !== undefined && (
            <Typography component="div"><b>Brand:</b>&nbsp;{value.brand}</Typography>
          )}
          {value.prism && value.prism.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Typography component="div"><b>Prism:</b></Typography>
              {value.prism.map((prism, prismIndex) => (
                <Typography component="div" key={prismIndex} sx={{ pl: 2 }}>
                  {`Amount: ${prism.amount}, Base: ${prism.base}`}
                </Typography>
              ))}
            </Box>
          )}
          <Annotation annotation={value.note} name="Note" resourceType={resourceType} />
        </Box>
      ))}
    </Box>
  );
};

export default VisionPrescriptionLensSpecification;
