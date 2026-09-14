import { useContext, useEffect, useState } from 'react';
import EnvironmentContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';
import FhirApi from '../api/fhirApi';

export function useResourceCount({
    resourceType,
    queryParameters,
    limit,
}: {
    resourceType: string | undefined;
    queryParameters: string[] | undefined;
    limit: number;
}): { count: number | null; atLimit: boolean; isLoading: boolean; error: string | null } {
    const { fhirUrl } = useContext(EnvironmentContext);
    const { setUserDetails } = useContext(UserContext);
    const [count, setCount] = useState<number | null>(null);
    const [atLimit, setAtLimit] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // queryParameters is a fresh array literal on every render from the caller
    // (e.g. `[\`${property}=${resolvedId}\`]`) — depending on it by identity would
    // refetch every render. Depend on its serialized contents instead.
    const serializedParams = JSON.stringify(queryParameters);

    useEffect(() => {
        if (!resourceType || !queryParameters) {
            // Declining to count must not leave the previous query's answer in state. Callers
            // reuse this hook instance across different subjects (Reference.tsx renders
            // ReferenceLink with `key={index}`, so React reuses the instance and the hook gets
            // new props rather than remounting). A leftover count here reports "this resource
            // exists" for a reference that was never queried, and because this path sets no
            // error, nothing downstream can tell it apart from a real answer.
            setCount(null);
            setAtLimit(false);
            setError(null);
            setIsLoading(false);
            return;
        }
        let cancelled = false;
        const controller = new AbortController();
        const fhirApi = new FhirApi({ fhirUrl, setUserDetails });
        setIsLoading(true);
        setError(null);
        fhirApi
            .getResourceCount({ resourceType, queryParameters, limit, signal: controller.signal })
            .then((result) => {
                if (!cancelled) {
                    setCount(result ? result.count : null);
                    setAtLimit(result ? result.atLimit : false);
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
    }, [fhirUrl, setUserDetails, resourceType, serializedParams, limit]);

    return { count, atLimit, isLoading, error };
}
