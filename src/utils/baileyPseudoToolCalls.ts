export interface PseudoToolCallMatch {
    /** The tool name the model claimed to call, or 'search_tools' for a bare exploration block. */
    name: string;
    /** Raw argument text found inside the block, if any. */
    args?: string;
}

interface ExtractPseudoToolCallsResult {
    /** `text` with every matched block removed. */
    cleanedText: string;
    /** Matches in document order. */
    matches: PseudoToolCallMatch[];
}

// Some backends occasionally have the model narrate a tool call as literal text (e.g. it ignores
// real MCP tool binding and falls back to a text convention seen during training) instead of
// making an actual structured call. This is an explicit allowlist of tags observed in practice —
// deliberately not a generic "any XML-looking tag" pattern, because Bailey's own answers can
// legitimately contain FHIR resource XML (e.g. <Patient>, <code>) that must never be stripped.
const PSEUDO_TOOL_TAG_PATTERN = /<(search_tools|call_tool)>([\s\S]*?)<\/\1>/g;
const NAME_TAG_PATTERN = /<name>([\s\S]*?)<\/name>/;
const ARGUMENTS_TAG_PATTERN = /<arguments>([\s\S]*?)<\/arguments>/;

function parseCallTool(inner: string): PseudoToolCallMatch {
    const name = NAME_TAG_PATTERN.exec(inner)?.[1]?.trim() || 'unknown_tool';
    const args = ARGUMENTS_TAG_PATTERN.exec(inner)?.[1]?.trim();
    return args ? { name, args } : { name };
}

// Extracts complete <search_tools>/<call_tool> blocks the model wrote as plain text, so callers
// can surface them as trace events instead of leaving raw tags in the chat bubble. Only matches
// complete (opened-and-closed) blocks — a tag that's still streaming in stays in `cleanedText`
// until it closes, rather than being cut off mid-tag.
export function extractPseudoToolCalls(text: string): ExtractPseudoToolCallsResult {
    const matches: PseudoToolCallMatch[] = [];
    const withoutTags = text.replace(PSEUDO_TOOL_TAG_PATTERN, (_full, tag: string, inner: string) => {
        matches.push(tag === 'call_tool' ? parseCallTool(inner) : { name: 'search_tools', args: inner.trim() });
        return '';
    });
    if (matches.length === 0) {
        // Nothing was removed, so there's no gap to collapse — running the collapse below
        // unconditionally would also rewrite unrelated 3+-blank-line runs the model never meant
        // as tool-call padding, e.g. PEP8-style double-blank-lines inside a fenced code sample.
        return { cleanedText: withoutTags, matches };
    }
    // Removing a block often leaves behind the blank line(s) that separated it from surrounding
    // prose; collapse those so the visible message doesn't end up with odd paragraph gaps.
    const cleanedText = withoutTags.replace(/\n{3,}/g, '\n\n');
    return { cleanedText, matches };
}
