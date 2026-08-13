import { useContext, useEffect, useState } from 'react';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import FhirApi from '../api/fhirApi';

export function useResourceCount({
    resourceType,
    queryParameters,
}: {
    resourceType: string | undefined;
    queryParameters: string[] | undefined;
}): { count: number | null; isLoading: boolean; error: string | null } {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const [count, setCount] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // queryParameters is a fresh array literal on every render from the caller
    // (e.g. `[\`${property}=${resolvedId}\`]`) — depending on it by identity would
    // refetch every render. Depend on its serialized contents instead.
    const serializedParams = JSON.stringify(queryParameters);

    useEffect(() => {
        if (!resourceType || !queryParameters) {
            return;
        }
        let cancelled = false;
        const controller = new AbortController();
        const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
        setIsLoading(true);
        setError(null);
        fhirApi
            .getResourceCount({ resourceType, queryParameters, signal: controller.signal })
            .then((result) => {
                if (!cancelled) {
                    setCount(result);
                }
            })
            .catch((err: unknown) => {
                if (cancelled) {
                    return;
                }
                if (err instanceof Error && err.name === 'AbortError') {
                    return;
                }
                setError(err instanceof Error ? err.message : 'Failed to load count');
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoading(false);
                }
            });
        return () => {
            cancelled = true;
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fhirUrl, setUserDetails, resourceType, serializedParams]);

    return { count, isLoading, error };
}
