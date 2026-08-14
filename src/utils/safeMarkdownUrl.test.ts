import { describe, expect, it } from 'vitest';
import { isSafeMarkdownUrl } from './safeMarkdownUrl';

describe('isSafeMarkdownUrl', () => {
    it.each(['http://example.com', 'https://example.com', 'mailto:a@b.com', '/relative/path', '#anchor'])(
        'allows %s',
        (href) => {
            expect(isSafeMarkdownUrl(href)).toBe(true);
        }
    );

    // Exercising the detector against the exact payloads it exists to reject, not constructing
    // a navigable URL.
    // eslint-disable-next-line no-script-url
    it.each(['javascript:alert(1)', 'JavaScript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)', 'custom-scheme:payload'])(
        'rejects %s',
        (href) => {
            expect(isSafeMarkdownUrl(href)).toBe(false);
        }
    );

    // Browsers strip tab/newline/CR and trim whitespace before resolving a URL's scheme, so a
    // naive regex that doesn't do the same normalization can be bypassed by hiding the scheme
    // behind noise a browser will happily ignore.
    it.each(['java\tscript:alert(1)', 'java\nscript:alert(1)', 'java\rscript:alert(1)', ' javascript:alert(1)', '\t\tjavascript:alert(1)'])(
        'rejects the whitespace-obfuscated bypass %j',
        (href) => {
            expect(isSafeMarkdownUrl(href)).toBe(false);
        }
    );
});
