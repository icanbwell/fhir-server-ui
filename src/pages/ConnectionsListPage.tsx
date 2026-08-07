import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import {
    Alert,
    Box,
    Button,
    Chip,
    CircularProgress,
    FormControl,
    InputLabel,
    List,
    ListItemButton,
    ListItemText,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TokenServiceApi from '../api/tokenServiceApi';
import UserContext from '../context/UserContext';
import { getLocalData } from '../utils/localData.utils';
import { ConnectionEntry } from '../types/connectionEntry';
import { CONNECTIONS_FORBIDDEN_MESSAGE } from '../constants/connectionsConstants';

const ConnectionsListPage = () => {
    const { setUserDetails } = useContext(UserContext);
    const navigate = useNavigate();

    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;
    const isBwellAppLogin = getLocalData('identityProvider') === 'bwellapp';

    const [connections, setConnections] = useState<ConnectionEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState<boolean>(false);
    const [category, setCategory] = useState<string>('All');
    const [search, setSearch] = useState<string>('');

    const loadConnections = async () => {
        if (!tokenServiceUrl) {
            return;
        }
        setLoading(true);
        setError(null);
        setForbidden(false);
        try {
            const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
            const { status, connections: loaded } = await api.listConnections();
            if (status === 403) {
                setForbidden(true);
            } else if (status === 200) {
                setConnections(loaded);
            } else {
                setError('Failed to load connections.');
            }
        } catch {
            setError('Failed to load connections.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConnections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenServiceUrl]);

    const categories = useMemo(() => {
        const unique = new Set(connections.map((c) => c.category));
        return ['All', ...Array.from(unique)];
    }, [connections]);

    const filtered = useMemo(() => {
        return connections.filter((c) => {
            if (category !== 'All' && c.category !== category) {
                return false;
            }
            if (!search.trim()) {
                return true;
            }
            const needle = search.trim().toLowerCase();
            return (
                c.display_name.toLowerCase().includes(needle) ||
                c.service_slug.toLowerCase().includes(needle)
            );
        });
    }, [connections, category, search]);

    const handleSelect = (connection: ConnectionEntry) => {
        navigate(`/connections/${encodeURIComponent(connection.service_slug)}/console`, {
            state: { connection },
        });
    };

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ p: 2 }}>
                    <Typography variant="h5" sx={{ mb: 2 }}>
                        Connections
                    </Typography>

                    {!isBwellAppLogin && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            Connections only work when signed in with b.well App login.
                        </Alert>
                    )}

                    {!tokenServiceUrl ? (
                        <Typography color="error">
                            Token Service is not configured (missing REACT_APP_TOKEN_SERVICE_URL).
                        </Typography>
                    ) : forbidden ? (
                        <Alert severity="warning">{CONNECTIONS_FORBIDDEN_MESSAGE}</Alert>
                    ) : (
                        <>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                <FormControl size="small" sx={{ minWidth: 160 }}>
                                    <InputLabel>Category</InputLabel>
                                    <Select
                                        value={category}
                                        label="Category"
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        {categories.map((c) => (
                                            <MenuItem key={c} value={c}>
                                                {c}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    size="small"
                                    label="Search"
                                    placeholder="Display name or service slug"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    sx={{ flex: 1, minWidth: 250 }}
                                />
                            </Box>

                            {error ? (
                                <Box sx={{ mb: 2 }}>
                                    <Typography color="error">{error}</Typography>
                                    <Button onClick={() => loadConnections()}>Retry</Button>
                                </Box>
                            ) : loading && connections.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                                    <CircularProgress />
                                </Box>
                            ) : filtered.length === 0 ? (
                                <Typography color="text.secondary">No connections found.</Typography>
                            ) : (
                                <List>
                                    {filtered.map((connection) => (
                                        <ListItemButton
                                            key={connection.service_slug}
                                            onClick={() => handleSelect(connection)}
                                            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 1 }}
                                        >
                                            <ListItemText
                                                primary={connection.display_name}
                                                secondary={connection.service_slug}
                                            />
                                            <Chip label={connection.category} size="small" sx={{ mr: 1 }} />
                                            <Chip label={connection.status} size="small" variant="outlined" sx={{ mr: 1 }} />
                                            {connection.expired && (
                                                <Chip label="Expired" size="small" color="warning" />
                                            )}
                                        </ListItemButton>
                                    ))}
                                </List>
                            )}
                        </>
                    )}
                </Box>
            </div>
            <Footer />
        </div>
    );
};

export default ConnectionsListPage;
