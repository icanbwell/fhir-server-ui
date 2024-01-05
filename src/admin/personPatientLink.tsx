import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Button, TextField, Container, Typography, Box } from '@mui/material';
import AdminApi from '../api/adminApi';
import EnvironmentContext from '../context/EnvironmentContext';
import PreJson from '../components/PreJson';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserContext from '../context/UserContext';

const PersonPatientLinkPage: React.FC = () => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setIsLoggedIn } = useContext(UserContext);
    const adminApi = new AdminApi({ fhirUrl, setIsLoggedIn });

    const [showLinkGraphData, setShowLinkGraphData] = useState({
        bwellPersonId: '',
        results: '',
    });

    const [createPersonToPersonLinkData, setCreatePersonToPersonLinkData] = useState({
        bwellPersonId: '',
        externalPersonId: '',
        results: '',
    });

    const [removePersonToPersonLinkData, setRemovePersonToPersonLinkData] = useState({
        bwellPersonId: '',
        externalPersonId: '',
        results: '',
    });

    const [createPersonToPatientLinkData, setCreatePersonToPatientLinkData] = useState({
        externalPersonId: '',
        patientId: '',
        results: '',
    });

    const [deleteBwellPersonData, setDeleteBwellPersonData] = useState({
        personId: '',
        results: '',
    });

    const handleShowLinkGraph = async (event: React.FormEvent) => {
        event.preventDefault();
        const data = await adminApi.showPersonToPersonLink(showLinkGraphData.bwellPersonId);
        setShowLinkGraphData({ ...showLinkGraphData, results: data.json });
    };

    const handleCreatePersonToPersonLink = async (event: React.FormEvent) => {
        event.preventDefault();
        const data = await adminApi.createPersonToPersonLink(
            createPersonToPersonLinkData.bwellPersonId,
            createPersonToPersonLinkData.externalPersonId
        );
        setCreatePersonToPersonLinkData({ ...createPersonToPersonLinkData, results: data.json });
    };

    const handleRemovePersonToPersonLink = async (event: React.FormEvent) => {
        event.preventDefault();
        const data = await adminApi.removePersonToPersonLink(
            removePersonToPersonLinkData.bwellPersonId,
            removePersonToPersonLinkData.externalPersonId
        );
        setRemovePersonToPersonLinkData({ ...removePersonToPersonLinkData, results: data.json });
    };

    const handleCreatePersonToPatientLink = async (event: React.FormEvent) => {
        event.preventDefault();
        const data = await adminApi.createPersonToPatientLink(
            createPersonToPatientLinkData.externalPersonId,
            createPersonToPatientLinkData.patientId
        );
        setCreatePersonToPatientLinkData({ ...createPersonToPatientLinkData, results: data.json });
    };

    const handleDeletePerson = async (event: React.FormEvent) => {
        event.preventDefault();
        const data = await adminApi.deletePerson(deleteBwellPersonData.personId);
        setDeleteBwellPersonData({ ...deleteBwellPersonData, results: data.json });
    };

    const location = useLocation();
    useEffect(() => {
        if (location.state?.bwellPersonId) {
            new AdminApi({ fhirUrl, setIsLoggedIn })
                .showPersonToPersonLink(location.state.bwellPersonId)
                .then((data: any) => {
                    setShowLinkGraphData({
                        bwellPersonId: location.state.bwellPersonId,
                        results: data.json,
                    });
                    window.history.replaceState({}, document.title);
                });
        }
    }, [location.state]);

    return (
        <Container maxWidth={false}>
            <Header />
            <Box sx={{ mt: 1, mb: 2 }}>
                <Typography variant="h5">Show Link Graph from b.well Person</Typography>
                <Typography style={{ color: '#494949' }}>
                    See linked Person and Patient resources from a b.well Person (recursive)
                </Typography>
                <form onSubmit={handleShowLinkGraph}>
                    <TextField
                        required
                        label="b.well Person"
                        value={showLinkGraphData.bwellPersonId}
                        onChange={(e) =>
                            setShowLinkGraphData({
                                ...showLinkGraphData,
                                bwellPersonId: e.target.value.split(' ').join(''),
                            })
                        }
                        sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        size="small"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ minWidth: '7rem', mr: 1, mt: 1 }}
                        size="medium"
                    >
                        Show
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        sx={{ minWidth: '7rem', mt: 1 }}
                        size="medium"
                        onClick={() =>
                            setShowLinkGraphData({
                                bwellPersonId: '',
                                results: '',
                            })
                        }
                    >
                        Clear
                    </Button>
                </form>
                <PreJson data={showLinkGraphData.results} />
            </Box>
            <hr />
            <Box sx={{ mt: 1, mb: 2 }}>
                <Typography variant="h5">Create Person to Person Link</Typography>
                <Typography style={{ color: '#494949' }}>
                    Add a link from one Person resource to another Person resource
                </Typography>
                <form onSubmit={handleCreatePersonToPersonLink}>
                    <TextField
                        required
                        label="b.well Person"
                        value={createPersonToPersonLinkData.bwellPersonId}
                        onChange={(e) =>
                            setCreatePersonToPersonLinkData({
                                ...createPersonToPersonLinkData,
                                bwellPersonId: e.target.value.split(' ').join(''),
                            })
                        }
                        sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        size="small"
                    />
                    <TextField
                        required
                        label="External Person"
                        value={createPersonToPersonLinkData.externalPersonId}
                        onChange={(e) =>
                            setCreatePersonToPersonLinkData({
                                ...createPersonToPersonLinkData,
                                externalPersonId: e.target.value.split(' ').join(''),
                            })
                        }
                        sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        size="small"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ minWidth: '7rem', mr: 1, mt: 1 }}
                        size="medium"
                    >
                        Create
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        sx={{ minWidth: '7rem', mt: 1 }}
                        size="medium"
                        onClick={() =>
                            setCreatePersonToPersonLinkData({
                                bwellPersonId: '',
                                externalPersonId: '',
                                results: '',
                            })
                        }
                    >
                        Clear
                    </Button>
                </form>
                <PreJson data={createPersonToPersonLinkData.results} />
            </Box>
            <hr />
            <Box sx={{ mt: 1, mb: 2 }}>
                <Typography variant="h5">Remove Person to Person Link</Typography>
                <Typography style={{ color: '#494949' }}>
                    Remove a link from one Person resource to another Person resource
                </Typography>
                <form onSubmit={handleRemovePersonToPersonLink}>
                    <TextField
                        required
                        label="b.well Person"
                        value={removePersonToPersonLinkData.bwellPersonId}
                        onChange={(e) =>
                            setRemovePersonToPersonLinkData({
                                ...removePersonToPersonLinkData,
                                bwellPersonId: e.target.value.split(' ').join(''),
                            })
                        }
                        sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        size="small"
                    />
                    <TextField
                        required
                        label="External Person"
                        value={removePersonToPersonLinkData.externalPersonId}
                        onChange={(e) =>
                            setRemovePersonToPersonLinkData({
                                ...removePersonToPersonLinkData,
                                externalPersonId: e.target.value.split(' ').join(''),
                            })
                        }
                        sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        size="small"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ minWidth: '7rem', mr: 1, mt: 1 }}
                        size="medium"
                    >
                        Remove
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        sx={{ minWidth: '7rem', mt: 1 }}
                        size="medium"
                        onClick={() =>
                            setRemovePersonToPersonLinkData({
                                bwellPersonId: '',
                                externalPersonId: '',
                                results: '',
                            })
                        }
                    >
                        Clear
                    </Button>
                </form>
                <PreJson data={removePersonToPersonLinkData.results} />
            </Box>
            <hr />
            <Box sx={{ mt: 1, mb: 2 }}>
                <Typography variant="h5">Create Person to Patient Link</Typography>
                <Typography style={{ color: '#494949' }}>
                    Create a link from one Person resource to a Patient resource. Leave External
                    Person blank to create a new Person resource with same meta tags as the Patient
                    resource
                </Typography>
                <form onSubmit={handleCreatePersonToPatientLink}>
                    <TextField
                        required
                        label="External Person"
                        value={createPersonToPatientLinkData.externalPersonId}
                        onChange={(e) =>
                            setCreatePersonToPatientLinkData({
                                ...createPersonToPatientLinkData,
                                externalPersonId: e.target.value.split(' ').join(''),
                            })
                        }
                        sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        size="small"
                    />
                    <TextField
                        required
                        label="Patient"
                        value={createPersonToPatientLinkData.patientId}
                        onChange={(e) =>
                            setCreatePersonToPatientLinkData({
                                ...createPersonToPatientLinkData,
                                patientId: e.target.value.split(' ').join(''),
                            })
                        }
                        sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        size="small"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ minWidth: '7rem', mr: 1, mt: 1 }}
                        size="medium"
                    >
                        Create
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        sx={{ minWidth: '7rem', mt: 1 }}
                        size="medium"
                        onClick={() =>
                            setCreatePersonToPatientLinkData({
                                patientId: '',
                                externalPersonId: '',
                                results: '',
                            })
                        }
                    >
                        Clear
                    </Button>
                </form>
                <PreJson data={createPersonToPatientLinkData.results} />
            </Box>
            <hr />
            <Box sx={{ mt: 1, mb: 2 }}>
                <Typography variant="h5">Delete b.well Person</Typography>
                <Typography style={{ color: '#494949' }}>
                    Delete a Person record (And remove links from other Person records)
                </Typography>
                <form onSubmit={handleDeletePerson}>
                    <TextField
                        required
                        label="Person"
                        value={deleteBwellPersonData.personId}
                        onChange={(e) =>
                            setDeleteBwellPersonData({
                                ...deleteBwellPersonData,
                                personId: e.target.value.split(' ').join(''),
                            })
                        }
                        sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        size="small"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        sx={{ minWidth: '7rem', mr: 1, mt: 1 }}
                        size="medium"
                    >
                        Delete
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        sx={{ minWidth: '7rem', mt: 1 }}
                        size="medium"
                        onClick={() =>
                            setDeleteBwellPersonData({
                                personId: '',
                                results: '',
                            })
                        }
                    >
                        Clear
                    </Button>
                </form>
                <PreJson data={deleteBwellPersonData.results} />
            </Box>
            <Footer />
        </Container>
    );
};

export default PersonPatientLinkPage;
