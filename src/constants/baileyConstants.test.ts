import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useBaileyChat, type BaileyChatTransport } from '@icanbwell/baileyai-chat-ui';
import { BAILEY_STATELESS_CHAT_OPTIONS } from './baileyConstants';

// Runs the real useBaileyChat hook (not mocked) against a transport that, like a backend with
// history persistence on, reports a conversation id on every turn. Without the stateless options
// the hook adopts that id and trims turn 2 to the newest message, which our transport would send
// without `x-chat-id` (see BAILEY_STATELESS_CHAT_OPTIONS).
function makeTransport() {
    const streamChat = vi.fn<BaileyChatTransport['streamChat']>(async ({ onChunk, onConversationId }) => {
        onConversationId?.('conv-A');
        onChunk(
            'data: ' +
                JSON.stringify({ type: 'response.output_text.delta', delta: 'ok' }) +
                '\n\n' +
                'data: ' +
                JSON.stringify({
                    type: 'response.completed',
                    response: { conversation: { id: 'conv-A', history_status: 'persisted' } },
                }) +
                '\n\n'
        );
        return { status: 200, text: '' };
    });
    return { streamChat } satisfies BaileyChatTransport;
}

async function sendTwoTurns(extra: Record<string, unknown>) {
    const transport = makeTransport();
    const { result } = renderHook(() =>
        useBaileyChat({ transport, model: 'm', instructions: 'i', tools: [], ...extra })
    );
    act(() => result.current.send('first'));
    await waitFor(() => expect(result.current.messages.some((m) => m.role === 'assistant')).toBe(true));
    await waitFor(() => expect(result.current.status).toBe('idle'));
    act(() => result.current.send('second'));
    await waitFor(() => expect(transport.streamChat).toHaveBeenCalledTimes(2));
    return transport.streamChat.mock.calls[1][0];
}

describe('BAILEY_STATELESS_CHAT_OPTIONS', () => {
    it('sends the full transcript and no conversation id on the second turn', async () => {
        window.sessionStorage.clear();
        const secondCall = await sendTwoTurns({ ...BAILEY_STATELESS_CHAT_OPTIONS });
        expect(secondCall.input.length).toBeGreaterThan(1);
        expect(secondCall.input.map((m) => m.content).join(' ')).toContain('first');
        expect(secondCall.conversationId).toBeUndefined();
        expect(window.sessionStorage.length).toBe(0);
    });

    it('control: the library defaults trim turn 2 to the newest message once an id is held', async () => {
        window.sessionStorage.clear();
        const secondCall = await sendTwoTurns({});
        expect(secondCall.input).toHaveLength(1);
    });
});
