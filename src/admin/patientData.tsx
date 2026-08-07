import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { Button, TextField, Typography, Box, LinearProgress } from '@mui/material';
import AdminApi from '../api/adminApi';
import EnvironmentContext from '../context/EnvironmentContext';
import PreJson from '../components/PreJson';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserContext from '../context/UserContext';

const PatientDataPage: React.FC = () => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const adminApi = new AdminApi({ fhirUrl, setUserDetails });

    const [isLoading, setIsLoading] = useState(false);

    const [patientDataForSearch, setPatientDataForSearch] = useState({
        patientId: '',
        results: '',
    });
    const [patientDataForDelete, setPatientDataForDelete] = useState({
        patientId: '',
        results: '',
    });
    const [personDataForSearch, setPersonDataForSearch] = useState({ personId: '', results: '' });
    const location = useLocation();
    const [personDataForDelete, setPersonDataForDelete] = useState(() => {
        const queryParams = new URLSearchParams(location.search);
        const personId = queryParams.get('personId') || '';
        return { personId, results: '', highlighted: !!personId };
    });

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const personId = queryParams.get('personId');
        if (personId) {
            setPersonDataForDelete((prev) => ({
                ...prev,
                personId,
                highlighted: true,
            }));
        }
    }, [location.search]);

    const handlePatientDataSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setPatientDataForSearch({ ...patientDataForSearch, results: '' });
        const data = await adminApi.getEverythingForPatient(patientDataForSearch.patientId);
        setPatientDataForSearch({ ...patientDataForSearch, results: data.json });
        setIsLoading(false);
    };

    const handleDeletePatientDataSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setPatientDataForDelete({ ...patientDataForDelete, results: '' });
        const data = await adminApi.deletePatient(patientDataForDelete.patientId);
        setPatientDataForDelete({ ...patientDataForDelete, results: data.json });
        setIsLoading(false);
    };

    const handlePersonDataSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setPersonDataForSearch({ ...personDataForSearch, results: '' });
        const data = await adminApi.getEverythingForPerson(personDataForSearch.personId);
        setPersonDataForSearch({ ...personDataForSearch, results: data.json });
        setIsLoading(false);
    };

    const handleDeletePersonDataSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setPersonDataForDelete({ ...personDataForDelete, results: '', highlighted: false });
        const data = await adminApi.deletePerson(personDataForDelete.personId);
        setPersonDataForDelete({ ...personDataForDelete, results: data.json, highlighted: false });
        setIsLoading(false);
    };


    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                {isLoading && <LinearProgress />}
                <div style={{ padding: '0 10px' }}>
                    <Box sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="h5">Show Patient Data Graph</Typography>
                    <Typography style={{ color: '#494949' }}>
                        Shows the graph of patient data (same as $everything endpoint)
                    </Typography>
                    <form onSubmit={handlePatientDataSubmit}>
                        <TextField
                            required
                            label="Patient Id"
                            value={patientDataForSearch.patientId}
                            onChange={(e) =>
                                setPatientDataForSearch({
                                    ...patientDataForSearch,
                                    patientId: e.target.value.split(' ').join(''),
                                })
                            }
                            size="small"
                            sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            sx={{ mt: 1, mr: 1 }}
                        >
                            Show Patient Data
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            sx={{ minWidth: '7rem', mt: 1 }}
                            size="medium"
                            onClick={() =>
                                setPatientDataForSearch({
                                    patientId: '',
                                    results: '',
                                })
                            }
                        >
                            Clear
                        </Button>
                    </form>
                    <PreJson data={patientDataForSearch.results} />
                </Box>
                <hr />
                <Box sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="h5">Delete Patient Data Graph</Typography>
                    <Typography style={{ color: '#494949' }}>
                        Deletes the graph of patient data (CONFIRM YOU ARE DOING THIS FOR THE
                        CORRECT PATIENT)
                    </Typography>
                    <form onSubmit={handleDeletePatientDataSubmit}>
                        <TextField
                            label="Patient Id"
                            value={patientDataForDelete.patientId}
                            onChange={(e) =>
                                setPatientDataForDelete({
                                    ...patientDataForDelete,
                                    patientId: e.target.value.split(' ').join(''),
                                })
                            }
                            size="small"
                            sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            sx={{ mt: 1, mr: 1 }}
                        >
                            Delete Patient Data
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            sx={{ minWidth: '7rem', mt: 1 }}
                            size="medium"
                            onClick={() =>
                                setPatientDataForDelete({
                                    patientId: '',
                                    results: '',
                                })
                            }
                        >
                            Clear
                        </Button>
                    </form>
                    <PreJson data={patientDataForDelete.results} />
                </Box>
                <hr />
                <Box sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="h5">Show Person Data Graph</Typography>
                    <Typography style={{ color: '#494949' }}>
                        Shows the graph of person data (same as $everything endpoint)
                    </Typography>
                    <form onSubmit={handlePersonDataSubmit}>
                        <TextField
                            label="Person Id"
                            value={personDataForSearch.personId}
                            onChange={(e) =>
                                setPersonDataForSearch({
                                    ...personDataForSearch,
                                    personId: e.target.value.split(' ').join(''),
                                })
                            }
                            size="small"
                            sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            sx={{ mt: 1, mr: 1 }}
                        >
                            Show Person Data
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            sx={{ minWidth: '7rem', mt: 1 }}
                            size="medium"
                            onClick={() =>
                                setPersonDataForSearch({
                                    personId: '',
                                    results: '',
                                })
                            }
                        >
                            Clear
                        </Button>
                    </form>
                    <PreJson data={personDataForSearch.results} />
                </Box>
                <hr />
                <Box sx={{ mt: 1, mb: 2 }}>
                    <Typography variant="h5">Delete Person Data Graph</Typography>
                    <Typography style={{ color: '#494949' }}>
                        Deletes the graph of person data (CONFIRM YOU ARE DOING THIS FOR THE CORRECT
                        PERSON)
                    </Typography>
                    <form onSubmit={handleDeletePersonDataSubmit}>
                        <TextField
                            label="Person Id"
                            value={personDataForDelete.personId}
                            onChange={(e) =>
                                setPersonDataForDelete({
                                    ...personDataForDelete,
                                    personId: e.target.value.split(' ').join(''),
                                    highlighted: false
                                })
                            }
                            size="small"
                            sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                            focused={personDataForDelete.highlighted ? true : undefined}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            sx={{ mt: 1, mr: 1 }}
                        >
                            Delete Person Data
                        </Button>
                        <Button
                            variant="contained"
                            color="secondary"
                            sx={{ minWidth: '7rem', mt: 1 }}
                            size="medium"
                            onClick={() =>
                                setPersonDataForDelete({
                                    personId: '',
                                    results: '',
                                    highlighted: false
                                })
                            }
                        >
                            Clear
                        </Button>
                    </form>
                    <PreJson data={personDataForDelete.results} />
                </Box>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default PatientDataPage;
