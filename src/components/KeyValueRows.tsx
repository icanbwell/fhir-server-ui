import { Box, Button, IconButton, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

export interface KeyValueRow {
    key: string;
    value: string;
}

interface KeyValueRowsProps {
    rows: KeyValueRow[];
    onChange?: (rows: KeyValueRow[]) => void;
    readOnly?: boolean;
    keyLabel?: string;
    valueLabel?: string;
}

const KeyValueRows = ({
    rows,
    onChange,
    readOnly = false,
    keyLabel = 'Key',
    valueLabel = 'Value',
}: KeyValueRowsProps) => {
    const updateRow = (index: number, field: 'key' | 'value', newValue: string) => {
        if (!onChange) {
            return;
        }
        const next = rows.map((row, i) => (i === index ? { ...row, [field]: newValue } : row));
        onChange(next);
    };

    const removeRow = (index: number) => {
        if (!onChange) {
            return;
        }
        onChange(rows.filter((_, i) => i !== index));
    };

    const addRow = () => {
        if (!onChange) {
            return;
        }
        onChange([...rows, { key: '', value: '' }]);
    };

    return (
        <Box>
            {rows.map((row, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                    <TextField
                        size="small"
                        label={keyLabel}
                        value={row.key}
                        disabled={readOnly}
                        onChange={(e) => updateRow(index, 'key', e.target.value)}
                        sx={{ flex: 1 }}
                    />
                    <TextField
                        size="small"
                        label={valueLabel}
                        value={row.value}
                        disabled={readOnly}
                        onChange={(e) => updateRow(index, 'value', e.target.value)}
                        sx={{ flex: 1 }}
                    />
                    {!readOnly && (
                        <IconButton size="small" onClick={() => removeRow(index)} aria-label="Remove row">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            ))}
            {!readOnly && (
                <Button size="small" startIcon={<AddIcon />} onClick={addRow}>
                    Add header
                </Button>
            )}
        </Box>
    );
};

export default KeyValueRows;
