import { useContext, useEffect, useState } from 'react';
import TokenServiceApi from '../api/tokenServiceApi';
import UserContext from '../context/UserContext';
import { ConnectionEntry } from '../types/connectionEntry';

export interface UseConnectionsResult {
    connections: ConnectionEntry[];
    loading: boolean;
    error: string | null;
    forbidden: boolean;
    configMissing: boolean;
    reload: () => void;
}

const useConnections = (): UseConnectionsResult => {
    const { setUserDetails } = useContext(UserContext);
    const tokenServiceUrl = import.meta.env.REACT_APP_TOKEN_SERVICE_URL;

    const [connections, setConnections] = useState<ConnectionEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [forbidden, setForbidden] = useState<boolean>(false);

    const loadConnections = async () => {
        if (!tokenServiceUrl) {
            return;
        }
        setLoading(true);
        setError(null);
        setForbidden(false);
        try {
            const api = new TokenServiceApi({ fhirUrl: tokenServiceUrl, setUserDetails });
            const { status, connections: loaded } = await api.listConnections();
            if (status === 403) {
                setForbidden(true);
            } else if (status === 200) {
                setConnections(loaded);
            } else {
                setError('Failed to load connections.');
            }
        } catch {
            setError('Failed to load connections.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConnections();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tokenServiceUrl]);

    return { connections, loading, error, forbidden, configMissing: !tokenServiceUrl, reload: loadConnections };
};

export default useConnections;
