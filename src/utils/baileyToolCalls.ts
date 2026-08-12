export interface ResolvedToolCall {
    /** The real tool name, unwrapped from the call_tool meta-tool if needed. */
    name: string;
    /** The real tool's arguments, or null if they couldn't be parsed. */
    args: Record<string, unknown> | null;
    /** True when this call was made indirectly via the call_tool meta-tool. */
    viaCallTool: boolean;
}

// Some backends (e.g. lazy MCP tool discovery) don't bind tools directly; instead the model
// calls a generic meta-tool named 'call_tool' whose own arguments are
// `{ name: <real tool>, arguments: <real args> }`. Ported from baileyai-skills-service's
// frontend/src/api/chat.ts (the other real consumer of this same endpoint) so tool-call chips
// here show the actually-invoked tool instead of the literal 'call_tool' wrapper name.
const CALL_TOOL_WRAPPER_NAME = 'call_tool';

// The real tool name only becomes available once call_tool's arguments are fully parseable
// (i.e. by response.output_item.done). Until then — e.g. at tool_start, when arguments are
// still empty/partial — fall back to this generic label rather than leaking the internal
// meta-tool name to the UI.
const UNRESOLVED_CALL_TOOL_LABEL = 'a tool';

export function resolveToolCall(name: string, argsJson: string | undefined): ResolvedToolCall {
    const fallback: ResolvedToolCall = {
        name: name === CALL_TOOL_WRAPPER_NAME ? UNRESOLVED_CALL_TOOL_LABEL : name,
        args: null,
        viaCallTool: false,
    };

    if (!argsJson) {
        return fallback;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(argsJson);
    } catch {
        return fallback;
    }
    if (typeof parsed !== 'object' || parsed === null) {
        return fallback;
    }
    const args = parsed as Record<string, unknown>;

    if (name === CALL_TOOL_WRAPPER_NAME) {
        const wrappedName = typeof args.name === 'string' ? args.name : undefined;
        const wrappedArgs = args.arguments;
        if (wrappedName && typeof wrappedArgs === 'object' && wrappedArgs !== null) {
            return { name: wrappedName, args: wrappedArgs as Record<string, unknown>, viaCallTool: true };
        }
        return fallback;
    }

    return { name, args, viaCallTool: false };
}
