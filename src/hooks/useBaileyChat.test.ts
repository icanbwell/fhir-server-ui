import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import useBaileyChat from './useBaileyChat';

const streamChatMock = vi.fn<(params: { signal?: AbortSignal }) => Promise<{ status: number; text: string }>>();

vi.mock('../api/baileyApi', () => ({
    // A regular function, not an arrow function — `new BaileyApi(...)` needs a real constructor,
    // and arrow functions can't be invoked with `new`.
    default: vi.fn().mockImplementation(function () {
        return { streamChat: streamChatMock };
    }),
}));

describe('useBaileyChat newChat', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('is a no-op when there is no in-flight stream or history', () => {
        const { result } = renderHook(() => useBaileyChat());

        act(() => {
            result.current.newChat();
        });

        expect(result.current.messages).toEqual([]);
        expect(result.current.traceEvents).toEqual([]);
        expect(result.current.lastRequest).toBeNull();
        expect(result.current.status).toBe('idle');
        expect(result.current.error).toBeNull();
    });

    it('aborts an in-flight stream and resets messages/lastRequest/status', async () => {
        let capturedSignal: AbortSignal | undefined;
        streamChatMock.mockImplementation(({ signal }) => {
            capturedSignal = signal;
            return new Promise(() => {
                // Never resolves — simulates a turn still streaming when newChat is called.
            });
        });

        const { result } = renderHook(() => useBaileyChat());

        act(() => {
            result.current.send('hello');
        });

        expect(result.current.status).toBe('streaming');
        expect(result.current.messages).toHaveLength(2); // user message + assistant placeholder
        expect(result.current.lastRequest).not.toBeNull();

        act(() => {
            result.current.newChat();
        });

        expect(capturedSignal?.aborted).toBe(true);
        expect(result.current.messages).toEqual([]);
        expect(result.current.traceEvents).toEqual([]);
        expect(result.current.lastRequest).toBeNull();
        expect(result.current.status).toBe('idle');
        expect(result.current.error).toBeNull();
    });
});
