import { JSONParser } from '@streamparser/json';

/**
 * Wraps @streamparser/json to emit each Bundle.entry[].resource as it completes, instead of
 * waiting for the whole Bundle JSON object to finish downloading.
 *
 * The underlying tokenizer is stream-fatal: a single malformed token anywhere aborts the whole
 * parse (it's one continuous tokenizer over the byte stream, not a per-entry recovery
 * mechanism), so onError should be treated as "stop calling write(), fall back to the
 * caller's own full JSON.parse of the complete response" rather than "skip one bad entry."
 *
 * With no `separator` option, the parser auto-ends after the single top-level Bundle object
 * completes — calling finish() after that would throw, so finish() checks isEnded first.
 */
export function createBundleEntryParser(
    onEntry: (resource: any) => void,
    onError: (err: Error) => void
): { write: (chunk: Uint8Array) => void; finish: () => void } {
    const parser = new JSONParser({ paths: ['$.entry.*.resource'], keepStack: false });
    parser.onValue = ({ value }) => onEntry(value);
    parser.onError = onError;

    return {
        write: (chunk: Uint8Array) => {
            if (!parser.isEnded) {
                parser.write(chunk);
            }
        },
        finish: () => {
            if (!parser.isEnded) {
                parser.end();
            }
        },
    };
}
