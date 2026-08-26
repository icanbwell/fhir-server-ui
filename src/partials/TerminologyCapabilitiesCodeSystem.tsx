import { Box, Typography } from '@mui/material';
import { TBaseResourceProps } from '../types/baseTypes';
import { TTerminologyCapabilitiesCodeSystem } from '../types/partials/TerminologyCapabilitiesCodeSystem';

type TTerminologyCapabilitiesCodeSystemProps = TBaseResourceProps & {
  field?: string;
  codeSystem: TTerminologyCapabilitiesCodeSystem | TTerminologyCapabilitiesCodeSystem[] | undefined;
};

const TerminologyCapabilitiesCodeSystem = ({ codeSystem, name }: TTerminologyCapabilitiesCodeSystemProps) => {
  if (!codeSystem) {
    return null;
  }
  const values = Array.isArray(codeSystem) ? codeSystem : [codeSystem];

  return (
    <Box>
      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>{name}</Typography>
      {values.map((value, index) => (
        <Box key={index} sx={{ mb: 1 }}>
          {value.uri && <Typography component="div"><b>URI:</b>&nbsp;{String(value.uri)}</Typography>}
          {value.subsumption !== undefined && (
            <Typography component="div"><b>Subsumption:</b>&nbsp;{String(value.subsumption)}</Typography>
          )}
          {value.version && value.version.length > 0 && (
            <Box sx={{ ml: 2 }}>
              {value.version.filter((v) => v).map((version, vIndex) => (
                <Typography component="div" key={vIndex}>
                  <b>Version:</b>&nbsp;{version.code}
                  {version.isDefault !== undefined && ` (default: ${version.isDefault})`}
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default TerminologyCapabilitiesCodeSystem;
