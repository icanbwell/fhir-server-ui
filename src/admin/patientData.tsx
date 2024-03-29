import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, TextField, Container, Typography, Box } from '@mui/material';
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

    const [patientDataForSearch, setPatientDataForSearch] = useState({
        patientId: '',
        results: '',
    });
    const [patientDataForDelete, setPatientDataForDelete] = useState({
        patientId: '',
        results: '',
    });
    const [personDataForSearch, setPersonDataForSearch] = useState({ personId: '', results: '' });
    const [personDataForDelete, setPersonDataForDelete] = useState({ personId: '', results: '' });

    const handlePatientDataSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const data = await adminApi.getEverythingForPatient(patientDataForSearch.patientId);
        setPatientDataForSearch({ ...patientDataForSearch, results: data.json });
    };

    const handleDeletePatientDataSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const data = await adminApi.deletePatient(patientDataForDelete.patientId);
        setPatientDataForDelete({ ...patientDataForDelete, results: data.json });
    };

    const handlePersonDataSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const data = await adminApi.getEverythingForPerson(personDataForSearch.personId);
        setPersonDataForSearch({ ...personDataForSearch, results: data.json });
    };

    const handleDeletePersonDataSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const data = await adminApi.deletePerson(personDataForDelete.personId);
        setPersonDataForDelete({ ...personDataForDelete, results: data.json });
    };

    const location = useLocation();
    useEffect(() => {
        if (location.state?.personId) {
            adminApi.deletePerson(location.state.personId).then((data: any) => {
                setPersonDataForDelete({ personId: location.state.personId, results: data.json });
                window.history.replaceState({}, document.title);
            });
        }
    }, []);

    return (
        <Container maxWidth={false}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
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
                                })
                            }
                        >
                            Clear
                        </Button>
                    </form>
                    <PreJson data={personDataForDelete.results} />
                </Box>
            </div>
            <Footer />
        </Container>
    );
};

export default PatientDataPage;
