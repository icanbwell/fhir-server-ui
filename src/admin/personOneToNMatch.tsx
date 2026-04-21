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
    Paper,
    FormControlLabel,
    Checkbox,
    IconButton,
    Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import AdminApi from '../api/adminApi';
import EnvironmentContext from '../context/EnvironmentContext';
import PreJson from '../components/PreJson';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserContext from '../context/UserContext';

const PersonOneToNMatchPage: React.FC = () => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const adminApi = new AdminApi({ fhirUrl, setUserDetails });
    const [id, setId] = useState<string>('');
    const [resourceType, setResourceType] = useState<string>('Patient');
    const [matchResourceType, setMatchResourceType] = useState<string>('Patient');
    const [includeMatchRequest, setIncludeMatchRequest] = useState<boolean>(true);
    const [matchRequest, setMatchRequest] = useState<any>(null);
    const [matchResponse, setMatchResponse] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedPayload, setEditedPayload] = useState<string>('');
    const [editError, setEditError] = useState<string>('');

    const handleMatchResourceTypeChange = (event: { target: { value: string } }) => {
        setMatchResourceType(event.target.value.split(' ').join(''));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setMatchRequest(null);
        setMatchResponse(null);
        setIsEditing(false);
        const data = await adminApi.runPersonOneToNMatch({
            id,
            resourceType,
            matchResourceType,
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

    const handleEditClick = () => {
        setEditedPayload(JSON.stringify(matchRequest, null, 2));
        setEditError('');
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditError('');
    };

    const handleSendEdited = async () => {
        let parsed;
        try {
            parsed = JSON.parse(editedPayload);
        } catch {
            setEditError('Invalid JSON');
            return;
        }
        setEditError('');
        setIsLoading(true);
        const data = await adminApi.runMatchWithPayload(parsed);
        setMatchRequest(parsed);
        setMatchResponse(data.json);
        setIsEditing(false);
        setIsLoading(false);
    };

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                {isLoading && <LinearProgress />}
                <div style={{ padding: '0 10px' }}>
                    <Box sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="h5">Run 1:N Matching Test</Typography>
                    <Typography style={{ color: '#494949' }}>
                        Looks up a Patient or Person by ID and sends to the <b>Person Matching Service</b> to find
                        all matching candidates (1:N matching).
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
                                id="id"
                                label="Resource Id"
                                name="id"
                                autoComplete="off"
                                autoFocus
                                value={id}
                                onChange={(event) =>
                                    setId(event.target.value.split(' ').join(''))
                                }
                            />
                            <FormControl sx={{ minWidth: '12rem', mt: 2, mr: 1 }}>
                                <InputLabel id="matchResourceType-label">Match Resource Type</InputLabel>
                                <Select
                                    labelId="matchResourceType-label"
                                    id="matchResourceType"
                                    value={matchResourceType}
                                    label="Match Resource Type"
                                    onChange={handleMatchResourceTypeChange}
                                >
                                    <MenuItem value="Patient">Patient</MenuItem>
                                    <MenuItem value="Person">Person</MenuItem>
                                </Select>
                            </FormControl>
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
                            Run 1:N Person Matching
                        </Button>
                    </Box>
                    {(matchRequest || matchResponse) && (
                        matchRequest ? (
                            <Box sx={{ display: 'flex', gap: 2, mt: 2, overflow: 'hidden' }}>
                                <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, overflow: 'auto', p: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="h6" sx={{ flexGrow: 1 }}>Match Request</Typography>
                                        {!isEditing && (
                                            <IconButton size="small" onClick={handleEditClick} title="Edit payload">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Box>
                                    {isEditing ? (
                                        <Box>
                                            <textarea
                                                value={editedPayload}
                                                onChange={(e) => setEditedPayload(e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    minHeight: '300px',
                                                    fontFamily: 'monospace',
                                                    fontSize: '13px',
                                                    padding: '8px',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '4px',
                                                    resize: 'vertical',
                                                }}
                                            />
                                            {editError && <Alert severity="error" sx={{ mt: 1 }}>{editError}</Alert>}
                                            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                                                <Button variant="contained" size="small" onClick={handleSendEdited}>
                                                    Send
                                                </Button>
                                                <Button variant="outlined" size="small" onClick={handleCancelEdit}>
                                                    Cancel
                                                </Button>
                                            </Box>
                                        </Box>
                                    ) : (
                                        <PreJson data={matchRequest} collapsed={2} />
                                    )}
                                </Paper>
                                <Paper variant="outlined" sx={{ flex: 1, minWidth: 0, overflow: 'auto', p: 2 }}>
                                    <Typography variant="h6" sx={{ mb: 1 }}>Match Response</Typography>
                                    <PreJson data={matchResponse} collapsed={2} />
                                </Paper>
                            </Box>
                        ) : (
                            <Box sx={{ mt: 2 }}>
                                <PreJson data={matchResponse} collapsed={2} />
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

export default PersonOneToNMatchPage;
