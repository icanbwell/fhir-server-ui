import React, { useContext, useState } from 'react';
import {
    Button,
    TextField,
    Typography,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    LinearProgress,
} from '@mui/material';
import AdminApi from '../api/adminApi';
import EnvironmentContext from '../context/EnvironmentContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserContext from '../context/UserContext';
import SelectableTable from '../components/SelectableTable';
import PreJson from '../components/PreJson';

const InvalidateCache: React.FC = () => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const adminApi = new AdminApi({ fhirUrl, setUserDetails });
    const [resourceId, setResourceId] = useState<string>('');
    const [resourceType, setResourceType] = useState<string>('Person');
    const [cacheKeys, setCacheKeys] = useState<string[]>([]);
    const [generationKeys, setGenerationKeys] = useState<{ key: string; value: string }[]>([]);
    const [selectedCacheKeys, setSelectedCacheKeys] = useState<string[]>([]);
    const [selectedGenerationKeys, setSelectedGenerationKeys] = useState<string[]>([]);
    const [results, setResults] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchPerformed, setSearchPerformed] = useState(false);

    const handleInvalidateCache = async () => {
        setResults('');
        setIsLoading(true);
        const data = await adminApi.invalidateCache({
            cacheKeys: [...selectedCacheKeys, ...selectedGenerationKeys],
        });
        setResults(data);
        setIsLoading(false);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setResults('');
        setIsLoading(true);
        setCacheKeys([]);
        setGenerationKeys([]);
        setSelectedCacheKeys([]);
        setSelectedGenerationKeys([]);
        setSearchPerformed(true);
        const data = await adminApi.getAllCacheKeys({
            resourceId,
            resourceType,
        });
        if (data && data.json && data.json.cacheKeys) {
            setCacheKeys(data.json.cacheKeys);
        }
        if (data && data.json && data.json.generationKeys) {
            setGenerationKeys(data.json.generationKeys);
        }
        if (data && data.status && data.status !== 200) {
            setResults(data);
        }
        setIsLoading(false);
    };

    const handleCacheSelectionChange = (selectedRows: any[]) => {
        setSelectedCacheKeys(selectedRows);
    };

    const handleGenerationSelectionChange = (selectedRows: any[]) => {
        setSelectedGenerationKeys(selectedRows);
    };

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                {isLoading && <LinearProgress />}
                <div style={{ padding: '0 10px' }}>
                    <Box sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="h5">Invalidate Resource Cache</Typography>
                    <Typography style={{ color: '#494949' }}>
                        Remove cached data for a specific resource to force fresh data retrieval
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <Box>
                            <FormControl sx={{ minWidth: '10rem', mt: 2, mr: 1 }}>
                                <InputLabel id="resourceType-label">Resource Type</InputLabel>
                                <Select
                                    labelId="resourceType-label"
                                    id="resourceType"
                                    value={resourceType}
                                    label="Resource Type"
                                    onChange={(event) =>
                                        setResourceType(event.target.value.split(' ').join(''))
                                    }
                                >
                                    <MenuItem value="Patient">Patient</MenuItem>
                                    <MenuItem value="Person">Person</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                sx={{ minWidth: '22rem', mr: 2 }}
                                margin="normal"
                                required
                                id="resourceId"
                                label="Resource Id"
                                name="resourceId"
                                autoComplete="off"
                                autoFocus
                                value={resourceId}
                                onChange={(event) =>
                                    setResourceId(event.target.value.split(' ').join(''))
                                }
                            />
                        </Box>
                        <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2 }}>
                            Get Cache Keys
                        </Button>
                    </Box>
                    {cacheKeys.length === 0 && generationKeys.length === 0 && !isLoading && searchPerformed && (
                        <Box sx={{ mt: 3 }}>
                            <Typography variant="body1" color="text.secondary">
                                No cache keys found for {resourceType}: {resourceId}
                            </Typography>
                        </Box>
                    )}
                    {cacheKeys.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <SelectableTable
                                name="Cache Keys"
                                rows={cacheKeys.map((key) => ({ key }))}
                                columns={['key']}
                                onSelectionChange={handleCacheSelectionChange}
                                getRowId={(row) => row.key}
                            />
                        </Box>
                    )}
                    {generationKeys.length > 0 && (
                        <Box sx={{ mt: 3 }}>
                            <SelectableTable
                                name="Generation Keys"
                                rows={generationKeys.map((item) => ({ key: item.key, value: item.value }))}
                                columns={['key', 'value']}
                                onSelectionChange={handleGenerationSelectionChange}
                                getRowId={(row) => row.key}
                            />
                        </Box>
                    )}
                    {(cacheKeys.length > 0 || generationKeys.length > 0) && (
                        <Button
                            disabled={
                                (!selectedCacheKeys.length && !selectedGenerationKeys.length) ||
                                isLoading
                            }
                            onClick={handleInvalidateCache}
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                        >
                            Invalidate cache
                        </Button>
                    )}
                <PreJson data={results} />
                </Box>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default InvalidateCache;
