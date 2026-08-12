import { BaileyStreamEvent } from '../types/baileyChat';

export interface ParsedSseFrames {
    events: BaileyStreamEvent[];
    remainder: string;
    done: boolean;
}

// Bailey occasionally nests an entire SSE-formatted payload inside a `response.output_text.delta`
// event's own `delta` string (mirrors baileyai-skills-service's frontend/src/api/chat.ts
// extractDeltaText). When that happens, the outer delta isn't real assistant text — it's a
// verbatim `data: {...}` frame (or several, newline-joined) that must itself be parsed, or the
// raw nested payload (including any tool-call narration inside it) leaks into the rendered
// message as literal text. Returns null when there's no real text to surface (e.g. the nested
// frame was `[DONE]` or carried no delta), so the caller can drop the event entirely.
function unwrapNestedDeltaText(delta: string): string | null {
    if (!delta.startsWith('data: ')) {
        return delta;
    }
    let text = '';
    for (const line of delta.split('\n')) {
        if (!line.startsWith('data: ')) {
            continue;
        }
        const payload = line.slice('data: '.length);
        if (payload === '[DONE]') {
            break;
        }
        try {
            const inner = JSON.parse(payload);
            if (inner?.type === 'response.output_text.delta' && inner.delta) {
                text += inner.delta;
            }
        } catch {
            // Malformed nested payload line — skip it rather than losing the whole frame.
        }
    }
    return text || null;
}

// Bailey streams standard SSE: frames separated by a blank line, each frame made of an
// optional `event: <name>` line and one or more `data: <payload>` lines. The payload's own
// `type` field (not the SSE event name) discriminates BaileyStreamEvent — except `event: error`
// frames, whose payload may be plain text rather than JSON. `buffer` may end mid-frame (a
// network chunk boundary rarely lines up with an SSE frame boundary); the incomplete tail is
// returned as `remainder` for the caller to prepend to the next chunk.
//
// CRLF is normalized to LF before splitting: the SSE spec allows CR, LF, or CRLF line
// endings, and an intermediary proxy can rewrite them. Splitting on '\n\n' alone would find
// no frame boundary at all in a '\r\n\r\n'-framed stream, so every byte would accumulate in
// `remainder` forever and the whole response would be lost while still reporting success.
export function parseSseFrames(buffer: string): ParsedSseFrames {
    const frames = buffer.replace(/\r\n/g, '\n').split('\n\n');
    const remainder = frames.pop() ?? '';
    const events: BaileyStreamEvent[] = [];
    let done = false;

    for (const frame of frames) {
        const lines = frame.split('\n').filter((line) => line.length > 0);
        let eventName = 'message';
        const dataLines: string[] = [];

        for (const line of lines) {
            if (line.startsWith('event:')) {
                eventName = line.slice('event:'.length).trim();
            } else if (line.startsWith('data:')) {
                dataLines.push(line.slice('data:'.length).trim());
            }
        }

        if (dataLines.length === 0) {
            continue;
        }
        const data = dataLines.join('\n');
        if (data === '[DONE]') {
            done = true;
            continue;
        }

        let parsed: any;
        try {
            parsed = JSON.parse(data);
        } catch {
            parsed = undefined;
        }

        if (eventName === 'error') {
            events.push({ type: 'error', message: parsed?.message ?? data });
        } else if (parsed?.type === 'response.output_text.delta' && typeof parsed.delta === 'string') {
            const text = unwrapNestedDeltaText(parsed.delta);
            if (text) {
                events.push({ type: 'response.output_text.delta', delta: text });
            }
        } else if (parsed && typeof parsed.type === 'string') {
            events.push(parsed as BaileyStreamEvent);
        }
    }

    return { events, remainder, done };
}
