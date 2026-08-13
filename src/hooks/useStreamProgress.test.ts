import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStreamProgress } from './useStreamProgress';

describe('useStreamProgress', () => {
    it('starts in a non-streaming, zeroed state', () => {
        const { result } = renderHook(() => useStreamProgress());

        expect(result.current.progress).toEqual({
            bytesReceived: 0,
            totalBytes: undefined,
            isStreaming: false,
        });
    });

    it('start() resets counters and marks streaming', () => {
        const { result } = renderHook(() => useStreamProgress());

        act(() => {
            result.current.onProgress(100, 200);
        });
        act(() => {
            result.current.start();
        });

        expect(result.current.progress).toEqual({
            bytesReceived: 0,
            totalBytes: undefined,
            isStreaming: true,
        });
    });

    it('onProgress() updates bytesReceived/totalBytes while streaming', () => {
        const { result } = renderHook(() => useStreamProgress());

        act(() => {
            result.current.start();
        });
        act(() => {
            result.current.onProgress(50, 1000);
        });

        expect(result.current.progress).toEqual({
            bytesReceived: 50,
            totalBytes: 1000,
            isStreaming: true,
        });
    });

    it('finish() stops streaming while preserving the last known counters', () => {
        const { result } = renderHook(() => useStreamProgress());

        act(() => {
            result.current.start();
        });
        act(() => {
            result.current.onProgress(1000, 1000);
        });
        act(() => {
            result.current.finish();
        });

        expect(result.current.progress).toEqual({
            bytesReceived: 1000,
            totalBytes: 1000,
            isStreaming: false,
        });
    });
});
