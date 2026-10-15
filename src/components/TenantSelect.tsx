import { FormControl, InputLabel, MenuItem, Select, SelectChangeEvent } from '@mui/material';

type TenantSelectProps = {
    labelId: string;
    names: string[];
    value: string;
    onChange: (name: string) => void;
};

const TenantSelect = ({ labelId, names, value, onChange }: TenantSelectProps) => (
    <FormControl fullWidth sx={{ mb: 2 }}>
        <InputLabel id={labelId}>Tenant</InputLabel>
        <Select
            labelId={labelId}
            label="Tenant"
            value={value}
            onChange={(event: SelectChangeEvent) => onChange(event.target.value)}
        >
            {names.map((name) => (
                <MenuItem key={name} value={name}>
                    {name}
                </MenuItem>
            ))}
        </Select>
    </FormControl>
);

export default TenantSelect;
