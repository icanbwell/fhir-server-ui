import React, { useContext, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button, TextField, Typography, Container } from '@mui/material';
import AdminApi from '../api/adminApi';
import EnvironmentContext from '../context/EnvironmentContext';
import PreJson from '../components/PreJson';
import Header from '../components/Header';
import Footer from '../components/Footer';
import UserContext from '../context/UserContext';

const SearchLogsPage: React.FC = () => {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const location = useLocation();
    const navigate = useNavigate();
    const adminApi = new AdminApi({ fhirUrl, setUserDetails });
    const [id, setId] = useState<string>('');
    const [results, setResults] = useState<String | Object | null>(null);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const pathname = location.pathname;
        if (pathname.includes('searchLogResults')) {
            if (queryParams.has('id') && queryParams.get('id')) {
                setId(queryParams.get('id') || '');
                adminApi
                    .searchLogs(queryParams.get('id') || '')
                    .then((data) => setResults(data.json));
            } else {
                setResults({ message: 'No id passed' });
            }
        }
    }, [location]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        navigate(`/admin/searchLogResults?id=${id}`);
    };

    return (
        <Container maxWidth={false}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <Typography variant="h5" sx={{ mt: 2 }}>
                    Search Logs
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        required
                        variant="outlined"
                        label="Enter requestId to search"
                        value={id}
                        onChange={(e) => setId(e.target.value.split(' ').join(''))}
                        sx={{ minWidth: '22rem', mr: 2, mt: 1 }}
                        size="small"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="medium"
                        sx={{ minWidth: '7rem', mt: 1 }}
                    >
                        Search
                    </Button>
                </form>
                <PreJson data={results} />
            </div>
            <Footer />
        </Container>
    );
};

export default SearchLogsPage;
