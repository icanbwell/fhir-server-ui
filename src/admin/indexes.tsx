import { useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import EnvContext from '../context/EnvironmentContext';
import AdminApi from '../api/adminApi';
import { Box, Container, LinearProgress, Typography } from '@mui/material';
import Header from '../components/Header';
import Footer from '../components/Footer';
import TableComponent from '../components/Table';
import { TIndexConfig, TIndexTableEntry, TIndexes } from '../types/baseTypes';
import UserContext from '../context/UserContext';

type TIndexCollectionEntries = {
    collectionName: string;
    indexTableEntry: TIndexTableEntry[];
};

const Indexes = () => {
    const { fhirUrl } = useContext(EnvContext);
    const { setIsLoggedIn } = useContext(UserContext);
    const adminApi = new AdminApi({ fhirUrl, setIsLoggedIn });
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    const [indexes, setIndexes] = useState<TIndexCollectionEntries[]>([]);

    useEffect(() => {
        adminApi.indexApi(location.pathname, location.search.includes('audit')).then((data) => {
            const newData: TIndexCollectionEntries[] = [];
            data.json?.forEach((collectionIndexes: TIndexes) => {
                const indexTableEntry: TIndexTableEntry[] = [];
                collectionIndexes.indexes.forEach((index: TIndexConfig) => {
                    let name = index.indexConfig.options?.name;
                    delete index.indexConfig.options?.name;
                    let entry: TIndexTableEntry = {
                        name,
                        keys: JSON.stringify(index.indexConfig.keys),
                        options: Object.keys(index.indexConfig.options).join(),
                        missing: index.missing ? `${index.missing}` : undefined,
                        extra: index.extra ? `${index.extra}` : undefined,
                    };
                    indexTableEntry.push(entry);
                });
                newData.push({ collectionName: collectionIndexes.collectionName, indexTableEntry });
            });
            setIndexes(newData);
            setIsLoading(false);
        });
    }, []);

    return (
        <Container maxWidth={false}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                {isLoading ? (
                    <LinearProgress />
                ) : indexes.length ? (
                    indexes?.map(
                        (
                            { collectionName, indexTableEntry }: TIndexCollectionEntries,
                            index: number
                        ) => (
                            <Box sx={{ mt: 1 }} key={index}>
                                <TableComponent
                                    rows={indexTableEntry}
                                    columns={['name', 'keys', 'options', 'missing', 'extra']}
                                    name={collectionName}
                                />
                            </Box>
                        )
                    )
                ) : (
                    <Typography variant="h5" sx={{ textAlign: 'center', mt: 2 }}>
                        No Index Problems
                    </Typography>
                )}
            </div>
            <Footer />
        </Container>
    );
};

export default Indexes;
