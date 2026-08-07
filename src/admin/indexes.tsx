import { useContext, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router';
import EnvContext from '../context/EnvironmentContext';
import AdminApi from '../api/adminApi';
import { Box, LinearProgress, Typography } from '@mui/material';
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
    const { setUserDetails } = useContext(UserContext);
    const adminApi = useMemo(() => {
        return new AdminApi({ fhirUrl, setUserDetails });
    }, [fhirUrl, setUserDetails]);
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
    }, [adminApi, location.pathname, location.search]);

    return (
        <div style={{ width: '100%', padding: 0, margin: 0 }}>
            <div style={{ minHeight: '92vh' }}>
                <Header />
                <div style={{ padding: '0 10px' }}>
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
            </div>
            <Footer />
        </div>
    );
};

export default Indexes;
