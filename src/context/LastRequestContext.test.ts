import { render } from '@testing-library/react';
import React, { useContext } from 'react';
import { describe, expect, it, vi, type Mock } from 'vitest';
import LastRequestContext, { TLastRequest, TRequestInfo } from './LastRequestContext';

// Only the module's own executable content — the createContext default value — is asserted here.
// Tests that installed a value through LastRequestContext.Provider and checked it came back out
// were removed: they asserted React's Context guarantee, not this module's behavior, and stayed
// green even when the module body was replaced with createContext<any>(undefined). The
// provider/consumer wiring that does have logic (deriving `pathname`, updating state) lives in
// App.tsx and belongs in a test of App.tsx.

type TLastRequestContextValue = {
    lastRequest: TLastRequest;
    recordRequest: (info: TRequestInfo) => void;
};

type TReport = Mock<(value: TLastRequestContextValue) => void>;

// Reports the context value this consumer received on every render, so the default value (the
// no-provider case) can be inspected exactly as a real component would observe it.
const Consumer = ({ report }: { report: (value: TLastRequestContextValue) => void }) => {
    report(useContext(LastRequestContext));
    return null;
};

const newReport = (): TReport => vi.fn<(value: TLastRequestContextValue) => void>();

const latestValue = (report: TReport): TLastRequestContextValue =>
    report.mock.calls[report.mock.calls.length - 1][0];

describe('LastRequestContext', () => {
    it('hands a consumer rendered with no provider a null lastRequest', () => {
        const report = newReport();

        render(React.createElement(Consumer, { report }));

        expect(latestValue(report).lastRequest).toBeNull();
    });

    it('default recordRequest is a safe no-op: it neither throws nor changes lastRequest', () => {
        const report = newReport();
        const { rerender } = render(React.createElement(Consumer, { report }));
        const { recordRequest } = latestValue(report);

        expect(() => recordRequest({ method: 'GET', url: '/4_0_0/Patient' })).not.toThrow();
        expect(recordRequest({ method: 'GET', url: '/4_0_0/Patient' })).toBeUndefined();

        rerender(React.createElement(Consumer, { report }));
        expect(latestValue(report).lastRequest).toBeNull();
    });
});
