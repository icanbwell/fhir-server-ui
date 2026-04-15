import React, { useContext, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
    Paper,
    FormControlLabel,
    Checkbox,
} from '@mui/material';
import AdminApi from '../api/adminApi';
import EnvironmentContext from '../context/EnvironmentContext';
import PreJson from '../components/PreJson';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserContext from '../context/UserContext';

const PersonMatchPage: React.FC = () => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const adminApi = new AdminApi({ fhirUrl, setUserDetails });
    const location = useLocation();
    const [sourceId, setSourceId] = useState<string>('');
    const [sourceType, setSourceType] = useState<string>('Patient');
    const [targetId, setTargetId] = useState<string>('');
    const [targetType, setTargetType] = useState<string>('Patient');
    const [includeMatchRequest, setIncludeMatchRequest] = useState<boolean>(true);
    const [matchRequest, setMatchRequest] = useState<any>(null);
    const [matchResponse, setMatchResponse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const paramValue = queryParams.get('includeMatchRequest');
        if (paramValue !== null) {
            setIncludeMatchRequest(paramValue !== 'false');
        }
    }, [location.search]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setMatchRequest(null);
        setMatchResponse(null);
        const data = await adminApi.runPersonMatch({
            sourceId,
            sourceType,
            targetId,
            targetType,
            includeMatchRequest,
        });
        const json = data.json;
        if (json && json.matchRequest) {
            setMatchRequest(json.matchRequest);
            setMatchResponse(json.matchResponse);
        } else {
            setMatchResponse(json);
        }
        setIsLoading(false);
    };

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                {isLoading && <LinearProgress />}
                <div style={{ padding: '0 10px' }}>
                    <Box sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="h5">Run 1:1 Matching Test</Typography>
                    <Typography style={{ color: '#494949' }}>
                        Calls <b>Person Matching Service</b> to give a diagnostic report on trying to match
                        these two records
                    </Typography>
                    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
                        <Box>
                            <FormControl sx={{ minWidth: '10rem', mt: 2, mr: 1 }}>
                                <InputLabel id="sourceType-label">Source Type</InputLabel>
                                <Select
                                    labelId="sourceType-label"
                                    id="sourceType"
                                    value={sourceType}
                                    label="Source Type"
                                    onChange={(event) =>
                                        setSourceType(event.target.value.split(' ').join(''))
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
                                id="sourceId"
                                label="Source Id"
                                name="sourceId"
                                autoComplete="off"
                                autoFocus
                                value={sourceId}
                                onChange={(event) =>
                                    setSourceId(event.target.value.split(' ').join(''))
                                }
                            />
                            <FormControl sx={{ minWidth: '10rem', mt: 2, mr: 1 }}>
                                <InputLabel id="targetType-label">Target Type</InputLabel>
                                <Select
                                    labelId="targetType-label"
                                    id="targetType"
                                    value={targetType}
                                    label="Target Type"
                                    onChange={(event) =>
                                        setTargetType(event.target.value.split(' ').join(''))
                                    }
                                >
                                    <MenuItem value="Patient">Patient</MenuItem>
                                    <MenuItem value="Person">Person</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField
                                sx={{ minWidth: '22rem' }}
                                margin="normal"
                                required
                                id="targetId"
                                label="Target Id"
                                name="targetId"
                                autoComplete="off"
                                autoFocus
                                value={targetId}
                                onChange={(event) =>
                                    setTargetId(event.target.value.split(' ').join(''))
                                }
                            />
                        </Box>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={includeMatchRequest}
                                    onChange={(e) => setIncludeMatchRequest(e.target.checked)}
                                />
                            }
                            label="Include Match Request"
                        />
                        <br />
                        <Button type="submit" variant="contained" sx={{ mt: 1, mb: 2 }}>
                            Run Person Matching Service
                        </Button>
                    </Box>
                    {(matchRequest || matchResponse) && (
                        matchRequest ? (
                            <Box sx={{ display: 'flex', gap: 2, mt: 2, overflow: 'hidden' }}>
                                <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, overflow: 'auto', p: 2 }}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>Match Request</Typography>
                                    <PreJson data={matchRequest} />
                                </Paper>
                                <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, overflow: 'auto', p: 2 }}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>Match Response</Typography>
                                    <PreJson data={matchResponse} />
                                </Paper>
                            </Box>
                        ) : (
                            <Box sx={{ mt: 2 }}>
                                <PreJson data={matchResponse} />
                            </Box>
                        )
                    )}
                </Box>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PersonMatchPage;
