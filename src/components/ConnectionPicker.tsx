import { useMemo } from 'react';
import { Alert, Autocomplete, Box, Chip, TextField, Typography, createFilterOptions } from '@mui/material';
import { getLocalData } from '../utils/localData.utils';
import { ConnectionEntry } from '../types/connectionEntry';
import { CONNECTIONS_FORBIDDEN_MESSAGE } from '../constants/connectionsConstants';

interface ConnectionPickerProps {
    connections: ConnectionEntry[];
    loading: boolean;
    forbidden: boolean;
    selectedSlug: string | undefined;
    onSelect: (slug: string | null) => void;
}

// MUI's Autocomplete requires options to already be sorted by the groupBy key for
// grouping to render correctly — it does not sort them itself.
const filterOptions = createFilterOptions<ConnectionEntry>({
    stringify: (option) => `${option.display_name} ${option.service_slug}`,
});

const ConnectionPicker = ({ connections, loading, forbidden, selectedSlug, onSelect }: ConnectionPickerProps) => {
    const isBwellAppLogin = getLocalData('identityProvider') === 'bwellapp';

    const sortedConnections = useMemo(
        () =>
            [...connections].sort(
                (a, b) => a.category.localeCompare(b.category) || a.display_name.localeCompare(b.display_name)
            ),
        [connections]
    );

    const selectedConnection = useMemo(
        () => connections.find((c) => c.service_slug === selectedSlug) ?? null,
        [connections, selectedSlug]
    );

    return (
        <Box sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Connections
            </Typography>

            {!isBwellAppLogin && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Connections only work when signed in with b.well App login.
                </Alert>
            )}

            {forbidden ? (
                <Alert severity="warning">{CONNECTIONS_FORBIDDEN_MESSAGE}</Alert>
            ) : (
                <Autocomplete
                    options={sortedConnections}
                    loading={loading}
                    value={selectedConnection}
                    groupBy={(option) => option.category}
                    getOptionLabel={(option) => option.display_name}
                    isOptionEqualToValue={(option, value) => option.service_slug === value.service_slug}
                    filterOptions={filterOptions}
                    onChange={(_, value) => onSelect(value ? value.service_slug : null)}
                    renderOption={(props, option) => (
                        <Box component="li" {...props} key={option.service_slug} sx={{ display: 'flex', gap: 1 }}>
                            <Typography sx={{ flex: 1 }}>{option.display_name}</Typography>
                            <Chip label={option.status} size="small" variant="outlined" />
                            {option.expired && <Chip label="Expired" size="small" color="warning" />}
                        </Box>
                    )}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Connection"
                            placeholder="Search by display name or service slug"
                        />
                    )}
                    sx={{ maxWidth: 480 }}
                />
            )}
        </Box>
    );
};

export default ConnectionPicker;
