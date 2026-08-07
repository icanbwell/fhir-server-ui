import React, { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { Button, TextField, Typography, Box, LinearProgress } from '@mui/material';
import AdminApi from '../api/adminApi';
import EnvironmentContext from '../context/EnvironmentContext';
import PreJson from '../components/PreJson';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserContext from '../context/UserContext';

const PersonPatientLinkPage: React.FC = () => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const adminApi = new AdminApi({ fhirUrl, setUserDetails });

    const [isLoading, setIsLoading] = useState(false);

    const location = useLocation();
    const [showLinkGraphData, setShowLinkGraphData] = useState(() => {
        const queryParams = new URLSearchParams(location.search);
        const bwellPersonId = queryParams.get('bwellPersonId') || '';
        return { bwellPersonId, results: '', highlighted: !!bwellPersonId };
    });

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const bwellPersonId = queryParams.get('bwellPersonId');
        if (bwellPersonId) {
            setShowLinkGraphData((prev) => ({
                ...prev,
                bwellPersonId,
                highlighted: true,
            }));
        }
    }, [location.search]);

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

    const [removePersonToPatientLinkData, setRemovePersonToPatientLinkData] = useState({
        personId: '',
        patientId: '',
        results: '',
    });

    const [updatePatientReferenceData, setUpdatePatientReferenceData] = useState({
        resourceId: '',
        resourceType: '',
        patientId: '',
        results: '',
    });

    const [deleteBwellPersonData, setDeleteBwellPersonData] = useState({
        personId: '',
        results: '',
    });

    const handleShowLinkGraph = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setShowLinkGraphData({
            ...showLinkGraphData,
            results: '',
        });
        const data = await adminApi.showPersonToPersonLink(showLinkGraphData.bwellPersonId);
        setShowLinkGraphData({ ...showLinkGraphData, results: data.json });
        setIsLoading(false);
    };

    const handleCreatePersonToPersonLink = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setCreatePersonToPersonLinkData({
            ...createPersonToPersonLinkData,
            results: '',
        });
        const data = await adminApi.createPersonToPersonLink(
            createPersonToPersonLinkData.bwellPersonId,
            createPersonToPersonLinkData.externalPersonId
        );
        setCreatePersonToPersonLinkData({ ...createPersonToPersonLinkData, results: data.json });
        setIsLoading(false);
    };

    const handleRemovePersonToPersonLink = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setRemovePersonToPersonLinkData({
            ...removePersonToPersonLinkData,
            results: '',
        });
        const data = await adminApi.removePersonToPersonLink(
            removePersonToPersonLinkData.bwellPersonId,
            removePersonToPersonLinkData.externalPersonId
        );
        setRemovePersonToPersonLinkData({ ...removePersonToPersonLinkData, results: data.json });
        setIsLoading(false);
    };

    const handleCreatePersonToPatientLink = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setCreatePersonToPatientLinkData({
            ...createPersonToPatientLinkData,
            results: '',
        });
        const data = await adminApi.createPersonToPatientLink(
            createPersonToPatientLinkData.externalPersonId,
            createPersonToPatientLinkData.patientId
        );
        setCreatePersonToPatientLinkData({ ...createPersonToPatientLinkData, results: data.json });
        setIsLoading(false);
    };

    const handleRemovePersonToPatientLink = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setRemovePersonToPatientLinkData({
            ...removePersonToPatientLinkData,
            results: '',
        });
        const data = await adminApi.removePersonToPatientLink(
            removePersonToPatientLinkData.personId,
            removePersonToPatientLinkData.patientId
        );
        setRemovePersonToPatientLinkData({ ...removePersonToPatientLinkData, results: data.json });
        setIsLoading(false);
    };

    const handleUpdatePatientReference = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setUpdatePatientReferenceData({
            ...updatePatientReferenceData,
            results: '',
        });
        const data = await adminApi.updatePatientReference(
            updatePatientReferenceData.resourceType,
            updatePatientReferenceData.resourceId,
            updatePatientReferenceData.patientId
        );
        setUpdatePatientReferenceData({ ...updatePatientReferenceData, results: data.json });
        setIsLoading(false);
    };

    const handleDeletePerson = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setDeleteBwellPersonData({
            ...deleteBwellPersonData,
            results: '',
        });
        const data = await adminApi.deletePerson(deleteBwellPersonData.personId);
        setDeleteBwellPersonData({ ...deleteBwellPersonData, results: data.json });
        setIsLoading(false);
    };


    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <Header />
            {isLoading && <LinearProgress />}
            <div style={{ minHeight: '92vh', padding: '0 10px' }}>
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
                        focused={showLinkGraphData.highlighted ? true : undefined}
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
                                highlighted: false,
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
                <Typography variant="h5">Remove Person to Patient Link</Typography>
                <Typography style={{ color: '#494949' }}>
                    Remove a link from Person resource to Patient resource
                </Typography>
                <form onSubmit={handleRemovePersonToPatientLink}>
                    <TextField
                        required
                        label="Person Id"
                        value={removePersonToPatientLinkData.personId}
                        onChange={(e) =>
                            setRemovePersonToPatientLinkData({
                                ...removePersonToPatientLinkData,
                                personId: e.target.value.split(' ').join(''),
                            })
                        }
                        sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        size="small"
                    />
                    <TextField
                        required
                        label="Patient Id"
                        value={removePersonToPatientLinkData.patientId}
                        onChange={(e) =>
                            setRemovePersonToPatientLinkData({
                                ...removePersonToPatientLinkData,
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
                        Remove
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        sx={{ minWidth: '7rem', mt: 1 }}
                        size="medium"
                        onClick={() =>
                            setRemovePersonToPatientLinkData({
                                personId: '',
                                patientId: '',
                                results: '',
                            })
                        }
                    >
                        Clear
                    </Button>
                </form>
                <PreJson data={removePersonToPatientLinkData.results} />
            </Box>
            <hr />
            <Box sx={{ mt: 1, mb: 2 }}>
                <Typography variant="h5">Update Patient Reference</Typography>
                <Typography style={{ color: '#494949' }}>
                    Update main patient reference in patient related resources
                </Typography>
                <form onSubmit={handleUpdatePatientReference}>
                    <TextField
                        required
                        label="Resource Type"
                        value={updatePatientReferenceData.resourceType}
                        onChange={(e) =>
                            setUpdatePatientReferenceData({
                                ...updatePatientReferenceData,
                                resourceType: e.target.value.split(' ').join(''),
                            })
                        }
                        sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        size="small"
                    />
                    <TextField
                        required
                        label="Resource Id"
                        value={updatePatientReferenceData.resourceId}
                        onChange={(e) =>
                            setUpdatePatientReferenceData({
                                ...updatePatientReferenceData,
                                resourceId: e.target.value.split(' ').join(''),
                            })
                        }
                        sx={{ minWidth: '22rem', mr: 1, mt: 1 }}
                        size="small"
                    />
                    <TextField
                        required
                        label="Patient Id"
                        value={updatePatientReferenceData.patientId}
                        onChange={(e) =>
                            setUpdatePatientReferenceData({
                                ...updatePatientReferenceData,
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
                        Update
                    </Button>
                </form>
                <PreJson data={updatePatientReferenceData.results} />
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
            </div>
            <Footer />
        </div>
    );
};

export default PersonPatientLinkPage;
