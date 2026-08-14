// Only these schemes (plus scheme-relative/relative URLs, which have no scheme to check) are
// safe to hand to the browser as a clickable link. An allowlist — rather than blocking known-bad
// schemes like javascript:/data:/vbscript: one at a time — closes the whole class of bypass via
// an as-yet-unlisted scheme. Every consumer of this renders hrefs sourced from Bailey's response
// text, which is model output, not trusted input.
const SAFE_URL_PROTOCOLS = /^(https?|mailto):/i;

// Browsers strip ASCII tab/newline/CR characters from a URL before resolving its scheme, and
// ignore leading/trailing whitespace — so "jav\tascript:alert(1)" or " javascript:alert(1)"
// would slip past a naive `^[a-z][a-z0-9+.-]*:` scheme check (no match => treated as a safe
// relative URL) while the browser still executes it as javascript: once it strips that noise.
const stripUrlNoise = (href: string): string => href.replace(/[\t\n\r]/g, '').trim();

export const isSafeMarkdownUrl = (href: string): boolean => {
    const normalized = stripUrlNoise(href);
    return !/^[a-z][a-z0-9+.-]*:/i.test(normalized) || SAFE_URL_PROTOCOLS.test(normalized);
};
