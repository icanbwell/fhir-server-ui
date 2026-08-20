import { render } from '@testing-library/react';
import { PropsWithChildren } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useBaileyChatTransport } from './useBaileyChatTransport';
import EnvContext from '../context/EnvironmentContext';
import UserContext from '../context/UserContext';

const streamChatMock = vi.fn();

vi.mock('../api/baileyApi', () => ({
    // A regular function, not an arrow function — `new BaileyApi(...)` needs a real constructor,
    // and arrow functions can't be invoked with `new`.
    default: vi.fn().mockImplementation(function () {
        return { streamChat: streamChatMock };
    }),
}));

function Wrapper({ baileyUrl, children }: PropsWithChildren<{ baileyUrl: string }>) {
    return (
        <EnvContext.Provider
            value={{
                fhirUrl: '',
                AUTH_PROVIDERS: '',
                FHIR_APP_VERSION: 'null',
                AWS_REGION: '',
                baileyUrl,
                baileyModel: '',
                baileyEnabled: true,
                getFhirServerVersion: () => 'null',
            }}
        >
            <UserContext.Provider value={{ userDetails: null, setUserDetails: undefined }}>
                {children}
            </UserContext.Provider>
        </EnvContext.Provider>
    );
}

describe('useBaileyChatTransport', () => {
    it('is referentially stable across re-renders when baileyUrl/setUserDetails are unchanged', () => {
        const seen: unknown[] = [];
        function Probe() {
            seen.push(useBaileyChatTransport());
            return null;
        }

        const { rerender } = render(
            <Wrapper baileyUrl="https://bailey.example.com">
                <Probe />
            </Wrapper>
        );
        rerender(
            <Wrapper baileyUrl="https://bailey.example.com">
                <Probe />
            </Wrapper>
        );

        expect(seen).toHaveLength(2);
        expect(seen[0]).toBe(seen[1]);
    });

    it('streamChat delegates to BaileyApi', async () => {
        streamChatMock.mockResolvedValue({ status: 200, text: '' });
        const seen: ReturnType<typeof useBaileyChatTransport>[] = [];
        function Probe() {
            seen.push(useBaileyChatTransport());
            return null;
        }

        render(
            <Wrapper baileyUrl="https://bailey.example.com">
                <Probe />
            </Wrapper>
        );

        const params = {
            model: 'gpt-5',
            instructions: '',
            input: [],
            tools: [],
            signal: new AbortController().signal,
            onChunk: vi.fn(),
        };
        await seen[0].streamChat(params);

        expect(streamChatMock).toHaveBeenCalledWith(params);
    });
});
