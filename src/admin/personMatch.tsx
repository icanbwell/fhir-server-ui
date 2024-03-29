import React, { useContext, useState } from 'react';
import {
    Button,
    TextField,
    Container,
    Typography,
    Box,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
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
    const [sourceId, setSourceId] = useState<string>('');
    const [sourceType, setSourceType] = useState<string>('Patient');
    const [targetId, setTargetId] = useState<string>('');
    const [targetType, setTargetType] = useState<string>('Patient');
    const [results, setResults] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const data = await adminApi.runPersonMatch({
            sourceId,
            sourceType,
            targetId,
            targetType,
        });
        setResults(data.json);
    };

    return (
        <Container maxWidth={false}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Box sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="h5">Run a Person Match diagnostic test</Typography>
                    <Typography style={{ color: '#494949' }}>
                        Calls Person Matching service to give a diagnostic report on trying to match
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
                        <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2 }}>
                            Run Person Matching Service
                        </Button>
                    </Box>
                    <PreJson data={results} />
                </Box>
            </div>
            <Footer />
        </Container>
    );
};

export default PersonMatchPage;
