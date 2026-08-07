import { useCallback, useState } from 'react';

export interface StreamProgressState {
    bytesReceived: number;
    totalBytes: number | undefined;
    isStreaming: boolean;
}

const INITIAL_STATE: StreamProgressState = {
    bytesReceived: 0,
    totalBytes: undefined,
    isStreaming: false,
};

export function useStreamProgress() {
    const [progress, setProgress] = useState<StreamProgressState>(INITIAL_STATE);

    const start = useCallback(() => {
        setProgress({ bytesReceived: 0, totalBytes: undefined, isStreaming: true });
    }, []);

    const onProgress = useCallback((bytesReceived: number, totalBytes: number | undefined) => {
        setProgress((prev) => ({ ...prev, bytesReceived, totalBytes, isStreaming: true }));
    }, []);

    const finish = useCallback(() => {
        setProgress((prev) => ({ ...prev, isStreaming: false }));
    }, []);

    return { progress, start, onProgress, finish };
}
