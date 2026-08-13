export interface BaileyChatInputMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface BaileyMcpToolConfig {
    type: 'mcp';
    server_url: string;
    server_label: string;
    // Deliberately no `allowed_tools` here — see baileyConstants.ts for why.
}

export interface BaileyOutputItem {
    // Not narrowed to 'function_call' | 'mcp_call' — response.output_item.added/done can also
    // carry message/reasoning items, which useBaileyChat's applyEvent must recognize and ignore
    // (not mis-parse as a tool call, and not surface as a trace event either).
    type: string;
    name?: string;
    arguments?: string;
    output?: string;
    is_error?: boolean;
    runtime_seconds?: number;
}

export type BaileyStreamEvent =
    | { type: 'response.output_text.delta'; delta: string }
    | { type: 'response.output_text.done' }
    | { type: 'response.output_item.added'; item: BaileyOutputItem }
    | { type: 'response.output_item.done'; item: BaileyOutputItem }
    | { type: 'task.progress'; status: string; message?: string }
    | { type: 'response.completed' }
    | { type: 'error'; message: string };

export interface BaileyMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    streaming?: boolean;
}

export interface BaileyStreamStats {
    chunkCount: number;
    firstChunkAt: number | null;
    lastChunkAt: number | null;
}

// Mirrors baileyai-skills-service's frontend/src/components/chat/useChatStream.ts LastRequest —
// captures what was actually sent/received on the most recent turn so the trace panel's request
// details view has something to show developers debugging a turn, independent of the trimmed-down
// chat-user-facing trace events.
export interface BaileyLastRequest {
    model: string;
    systemPrompt: string;
    messages: BaileyChatInputMessage[];
    // Mirrors the same values passed to BaileyApi.streamChat, so the trace panel's "Full payload"
    // view can show the actual wire request instead of a partial reconstruction of it.
    tools: BaileyMcpToolConfig[];
    stream: true;
    sentAt: number;
    streamStats: BaileyStreamStats;
    response?: { content: string };
}

// Mirrors baileyai-skills-service's frontend/src/api/chat.ts TraceEvent — every SSE event that
// isn't assistant text becomes one of these, tracked separately from BaileyMessage (not attached
// to a specific message) so the chat UI can render tool calls in a details panel instead of
// inline in the transcript, exactly like the other real consumer of this endpoint.
//
// `turnSentAt` is the sentAt of the turn that produced the event — traceEvents accumulates across
// turns (only cleared via user-triggered Clear), so a row needs its OWN turn's send time to
// compute a meaningful gap; the most recent turn's sentAt (as tracked by lastRequest) would be
// wrong for events produced by an earlier turn. See toTraceRows in baileyTrace.ts.
export type BaileyTraceEvent =
    | { kind: 'tool_start'; name: string; args?: string; at: number; turnSentAt: number }
    | {
          kind: 'tool_end';
          name: string;
          args?: string;
          at: number;
          turnSentAt: number;
          output?: string;
          isError?: boolean;
          runtimeSeconds?: number;
      }
    // The model wrote what looks like a tool call as plain text (e.g. <call_tool>...</call_tool>)
    // instead of making a real one — see baileyPseudoToolCalls.ts. Kept distinct from tool_start/
    // tool_end (rather than faking one of those) so the details panel never implies a tool
    // actually ran when nothing did.
    | { kind: 'pseudo_tool_call'; name: string; args?: string; at: number; turnSentAt: number }
    | { kind: 'progress'; status: string; message?: string; at: number; turnSentAt: number }
    | { kind: 'error'; message: string; at: number; turnSentAt: number }
    // Any SSE event type this client doesn't have specific handling for at all (message/
    // reasoning output items are explicitly ignored, not routed here — see BaileyOutputItem).
    // Kept, not silently dropped, so the details panel is a complete record of the rest.
    | { kind: 'raw'; eventType: string; raw: string; at: number; turnSentAt: number };
