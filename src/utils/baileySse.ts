import { BaileyStreamEvent } from '../types/baileyChat';

export interface ParsedSseFrames {
    events: BaileyStreamEvent[];
    remainder: string;
    done: boolean;
}

// Bailey streams standard SSE: frames separated by a blank line, each frame made of an
// optional `event: <name>` line and one or more `data: <payload>` lines. The payload's own
// `type` field (not the SSE event name) discriminates BaileyStreamEvent — except `event: error`
// frames, whose payload may be plain text rather than JSON. `buffer` may end mid-frame (a
// network chunk boundary rarely lines up with an SSE frame boundary); the incomplete tail is
// returned as `remainder` for the caller to prepend to the next chunk.
export function parseSseFrames(buffer: string): ParsedSseFrames {
    const frames = buffer.split('\n\n');
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
        } else if (parsed && typeof parsed.type === 'string') {
            events.push(parsed as BaileyStreamEvent);
        }
    }

    return { events, remainder, done };
}
