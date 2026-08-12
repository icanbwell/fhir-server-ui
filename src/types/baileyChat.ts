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
    // carry message/reasoning items, which resolveOutputItem below must recognize and route to
    // the 'raw' trace fallback rather than mis-parse as a tool call.
    type: string;
    name?: string;
    arguments?: string;
    output?: string;
    is_error?: boolean;
    runtime_seconds?: number;
}

export type BaileyStreamEvent =
    | { type: 'response.output_text.delta'; delta: string }
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

// Mirrors baileyai-skills-service's frontend/src/api/chat.ts TraceEvent — every SSE event that
// isn't assistant text becomes one of these, tracked separately from BaileyMessage (not attached
// to a specific message) so the chat UI can render tool calls in a details panel instead of
// inline in the transcript, exactly like the other real consumer of this endpoint.
export type BaileyTraceEvent =
    | { kind: 'tool_start'; name: string; args?: string; at: number }
    | {
          kind: 'tool_end';
          name: string;
          args?: string;
          at: number;
          output?: string;
          isError?: boolean;
          runtimeSeconds?: number;
      }
    | { kind: 'progress'; status: string; message?: string; at: number }
    | { kind: 'error'; message: string; at: number }
    // Any SSE event this client doesn't have specific handling for (e.g. a message/reasoning
    // output item). Kept, not silently dropped, so the details panel is a complete record of
    // what happened on the wire.
    | { kind: 'raw'; eventType: string; raw: string; at: number };
