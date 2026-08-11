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
    type: 'function_call' | 'mcp_call';
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

export interface BaileyToolCall {
    name: string;
    arguments?: string;
    output?: string;
    isError?: boolean;
}

export interface BaileyMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    streaming?: boolean;
    toolCalls?: BaileyToolCall[];
}
