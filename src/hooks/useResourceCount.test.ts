import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

const { mockGetResourceCount, mockGetVersion, mockFhirApiConstructor } = vi.hoisted(() => ({
    mockGetResourceCount: vi.fn(),
    // EnvironmentContext.ts:7-11 calls new FhirApi(...).getVersion().then(...) at module load,
    // and useResourceCount imports that context — so getVersion has to return a real promise
    // from the moment the module graph is evaluated, i.e. before any beforeEach runs.
    mockGetVersion: vi.fn(() => Promise.resolve('1.0.0')),
    mockFhirApiConstructor: vi.fn(),
}));

// FhirApi is the only dependency of the hook worth faking: it owns the network. Everything
// else (the two contexts, the effect wiring, the abort plumbing) is the code under test.
vi.mock('../api/fhirApi', () => ({
    default: vi.fn().mockImplementation(function FhirApiMock(args: any) {
        mockFhirApiConstructor(args);
        return { getResourceCount: mockGetResourceCount, getVersion: mockGetVersion };
    }),
}));

import { useResourceCount } from './useResourceCount';

beforeEach(() => {
    vi.clearAllMocks();
    mockGetResourceCount.mockResolvedValue({ count: 0, atLimit: false });
});

type CountProps = {
    resourceType: string | undefined;
    queryParameters: string[] | undefined;
    limit: number;
};

const PATIENT_1: CountProps = { resourceType: 'Patient', queryParameters: ['id=p1'], limit: 1 };

describe('useResourceCount happy path', () => {
    it('reports the count returned by the server and clears the loading flag', async () => {
        mockGetResourceCount.mockResolvedValue({ count: 3, atLimit: false });

        const { result } = renderHook(() => useResourceCount(PATIENT_1));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.count).toBe(3);
        expect(result.current.atLimit).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('passes the resource type, query parameters, limit and an abort signal through', async () => {
        renderHook(() => useResourceCount(PATIENT_1));

        await waitFor(() => expect(mockGetResourceCount).toHaveBeenCalledTimes(1));
        const args = mockGetResourceCount.mock.calls[0][0];
        expect(args.resourceType).toBe('Patient');
        expect(args.queryParameters).toEqual(['id=p1']);
        expect(args.limit).toBe(1);
        expect(args.signal).toBeInstanceOf(AbortSignal);
    });

    it('surfaces the at-limit flag so callers can render "10+" instead of a hard number', async () => {
        mockGetResourceCount.mockResolvedValue({ count: 10, atLimit: true });

        const { result } = renderHook(() =>
            useResourceCount({ resourceType: 'Observation', queryParameters: ['subject=p1'], limit: 10 })
        );

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.count).toBe(10);
        expect(result.current.atLimit).toBe(true);
    });

    it('reports a zero count as 0, distinguishably from "not counted" (null)', async () => {
        mockGetResourceCount.mockResolvedValue({ count: 0, atLimit: false });

        const { result } = renderHook(() => useResourceCount(PATIENT_1));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.count).toBe(0);
    });

    it('maps a null result (non-2xx from the server) to an uncounted state, not to zero', async () => {
        mockGetResourceCount.mockResolvedValue(null);

        const { result } = renderHook(() => useResourceCount(PATIENT_1));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.count).toBeNull();
        expect(result.current.atLimit).toBe(false);
        expect(result.current.error).toBeNull();
    });
});

describe('useResourceCount short-circuits', () => {
    it('never fetches when there is no resource type', () => {
        const { result } = renderHook(() =>
            useResourceCount({ resourceType: undefined, queryParameters: ['id=p1'], limit: 1 })
        );

        expect(mockGetResourceCount).not.toHaveBeenCalled();
        expect(result.current).toEqual({
            count: null,
            atLimit: false,
            isLoading: false,
            error: null,
        });
    });

    it('never fetches when there are no query parameters (the AuditEvent opt-out)', () => {
        const { result } = renderHook(() =>
            useResourceCount({ resourceType: 'AuditEvent', queryParameters: undefined, limit: 10 })
        );

        expect(mockGetResourceCount).not.toHaveBeenCalled();
        expect(result.current.count).toBeNull();
        expect(result.current.isLoading).toBe(false);
    });
});

describe('useResourceCount refetch behavior', () => {
    it('refetches when the query parameters change', async () => {
        mockGetResourceCount.mockResolvedValue({ count: 1, atLimit: false });
        const { result, rerender } = renderHook((props: CountProps) => useResourceCount(props), {
            initialProps: PATIENT_1,
        });

        await waitFor(() => expect(result.current.count).toBe(1));

        mockGetResourceCount.mockResolvedValue({ count: 7, atLimit: false });
        rerender({ resourceType: 'Patient', queryParameters: ['id=p2'], limit: 1 });

        await waitFor(() => expect(result.current.count).toBe(7));
        expect(mockGetResourceCount).toHaveBeenCalledTimes(2);
    });

    it('does not refetch when the caller passes a new array with identical contents', async () => {
        const { result, rerender } = renderHook((props: CountProps) => useResourceCount(props), {
            initialProps: { resourceType: 'Patient', queryParameters: ['id=p1'], limit: 1 },
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        // A fresh array literal with the same contents — exactly what ReferenceLink does on
        // every render. Depending on identity here would refetch forever.
        rerender({ resourceType: 'Patient', queryParameters: ['id=p1'], limit: 1 });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(mockGetResourceCount).toHaveBeenCalledTimes(1);
    });

    it('refetches when only the limit changes', async () => {
        const { result, rerender } = renderHook((props: CountProps) => useResourceCount(props), {
            initialProps: { resourceType: 'Patient', queryParameters: ['id=p1'], limit: 1 },
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        rerender({ resourceType: 'Patient', queryParameters: ['id=p1'], limit: 10 });

        await waitFor(() => expect(mockGetResourceCount).toHaveBeenCalledTimes(2));
        expect(mockGetResourceCount.mock.calls[1][0].limit).toBe(10);
    });

    it('BUG-004: clears a previous count when the new props short-circuit the fetch', async () => {
        // Reachable through Reference.tsx:37, which renders ReferenceLink with `key={index}`.
        // Index keys mean React reuses the same component instance when the reference array
        // changes, so the hook receives new props rather than remounting. If the new reference
        // has no id (`reference.split('/')` yields no second element — e.g. a contained or
        // uuid-only reference), the effect returns at useResourceCount.ts:28-30 without
        // resetting anything: `count` still holds the PREVIOUS reference's count while
        // `isLoading` is false and `error` is null. ReferenceLink then renders its green
        // "Resource exists" checkmark for a reference it never queried. Correct behavior is to
        // report "not counted" whenever the hook declines to count.
        mockGetResourceCount.mockResolvedValue({ count: 1, atLimit: false });
        const { result, rerender } = renderHook((props: CountProps) => useResourceCount(props), {
            initialProps: PATIENT_1,
        });

        await waitFor(() => expect(result.current.count).toBe(1));

        rerender({ resourceType: 'Patient', queryParameters: undefined, limit: 1 });

        expect(mockGetResourceCount).toHaveBeenCalledTimes(1);
        expect(result.current.count).toBeNull();
    });

    it('surfaces a refetch failure for the new parameters, superseding the previous answer', async () => {
        // A failure on a *refetch* takes a different path from a failure on the first fetch
        // (there is already a settled successful value in state), so it is worth its own test:
        // the new params must actually be requested, the new query's failure must be surfaced,
        // and the hook must settle. What `count` holds afterwards is deliberately NOT asserted —
        // BUG-004's suggested fix also clears `count` on the `.catch` path, and this test must
        // stay correct before and after that change.
        mockGetResourceCount.mockResolvedValue({ count: 5, atLimit: false });
        const { result, rerender } = renderHook((props: CountProps) => useResourceCount(props), {
            initialProps: PATIENT_1,
        });

        await waitFor(() => expect(result.current.count).toBe(5));

        mockGetResourceCount.mockRejectedValue(new Error('Network request failed'));
        rerender({ resourceType: 'Patient', queryParameters: ['id=p2'], limit: 1 });

        await waitFor(() => expect(result.current.error).toBe('Network request failed'));
        expect(result.current.isLoading).toBe(false);
        expect(mockGetResourceCount).toHaveBeenCalledTimes(2);
        expect(mockGetResourceCount.mock.calls[1][0].queryParameters).toEqual(['id=p2']);
    });
});

describe('useResourceCount error and cancellation handling', () => {
    it('reports the error message from a failed count', async () => {
        mockGetResourceCount.mockRejectedValue(new Error('FHIR server unavailable'));

        const { result } = renderHook(() => useResourceCount(PATIENT_1));

        await waitFor(() => expect(result.current.error).toBe('FHIR server unavailable'));
        expect(result.current.isLoading).toBe(false);
        expect(result.current.count).toBeNull();
    });

    it('falls back to a generic message when the rejection is not an Error', async () => {
        mockGetResourceCount.mockRejectedValue('some string');

        const { result } = renderHook(() => useResourceCount(PATIENT_1));

        await waitFor(() => expect(result.current.error).toBe('Failed to load count'));
    });

    it('ignores an AbortError so an unmount-cancelled request shows no error', async () => {
        mockGetResourceCount.mockRejectedValue(
            Object.assign(new Error('aborted'), { name: 'AbortError' })
        );

        const { result } = renderHook(() => useResourceCount(PATIENT_1));

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.error).toBeNull();
    });

    it('aborts the in-flight request when the hook unmounts', async () => {
        let capturedSignal: AbortSignal | undefined;
        mockGetResourceCount.mockImplementation(({ signal }: any) => {
            capturedSignal = signal;
            return new Promise(() => undefined);
        });

        const { unmount } = renderHook(() => useResourceCount(PATIENT_1));

        await waitFor(() => expect(capturedSignal).toBeDefined());
        expect(capturedSignal?.aborted).toBe(false);

        unmount();

        expect(capturedSignal?.aborted).toBe(true);
    });

    it('aborts the superseded request when the query parameters change', async () => {
        const signals: AbortSignal[] = [];
        mockGetResourceCount.mockImplementation(({ signal }: any) => {
            signals.push(signal);
            return new Promise(() => undefined);
        });

        const { rerender } = renderHook((props: CountProps) => useResourceCount(props), {
            initialProps: PATIENT_1,
        });

        await waitFor(() => expect(signals).toHaveLength(1));
        rerender({ resourceType: 'Patient', queryParameters: ['id=p2'], limit: 1 });

        await waitFor(() => expect(signals).toHaveLength(2));
        expect(signals[0].aborted).toBe(true);
        expect(signals[1].aborted).toBe(false);
    });

    it('does not apply a late response from a request that was already superseded', async () => {
        let resolveFirst: (value: any) => void = () => undefined;
        mockGetResourceCount
            .mockImplementationOnce(
                () =>
                    new Promise((resolve) => {
                        resolveFirst = resolve;
                    })
            )
            .mockResolvedValue({ count: 99, atLimit: false });

        const { result, rerender } = renderHook((props: CountProps) => useResourceCount(props), {
            initialProps: PATIENT_1,
        });

        await waitFor(() => expect(mockGetResourceCount).toHaveBeenCalledTimes(1));
        rerender({ resourceType: 'Patient', queryParameters: ['id=p2'], limit: 1 });
        await waitFor(() => expect(result.current.count).toBe(99));

        // The first, now-cancelled request finally answers with a different number.
        resolveFirst({ count: 1, atLimit: false });

        await waitFor(() => expect(result.current.count).toBe(99));
    });
});
