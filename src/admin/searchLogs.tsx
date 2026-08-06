import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Button, TextField, Typography, LinearProgress } from '@mui/material';
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
    const adminApi = useMemo(() => {
        return new AdminApi({ fhirUrl, setUserDetails });
    }, [fhirUrl, setUserDetails]);
    const [id, setId] = useState<string>('');
    const [results, setResults] = useState<String | Object | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const pathname = location.pathname;
        if (pathname.includes('searchLogResults')) {
            if (queryParams.has('id') && queryParams.get('id')) {
                setIsLoading(true);
                setResults(null);
                setId(queryParams.get('id') || '');
                adminApi
                    .searchLogs(queryParams.get('id') || '')
                    .then((data) => {
                        setIsLoading(false);
                        setResults(data.json);
                    });
            } else {
                setResults({ message: 'No id passed' });
            }
        }
    }, [adminApi, location]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        navigate(`/admin/searchLogResults?id=${id}`);
    };

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <Header />
            <div style={{ minHeight: '85vh', padding: '0 10px' }}>
                {isLoading && <LinearProgress />}
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
        </div>
    );
};

export default SearchLogsPage;
