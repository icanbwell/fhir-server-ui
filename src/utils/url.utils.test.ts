import { describe, expect, it } from 'vitest';
import { appendFormatJson } from './url.utils';

describe('appendFormatJson', () => {
    it('appends with a leading ? when the URL has no query string', () => {
        expect(appendFormatJson('/4_0_0/Patient/123')).toBe('/4_0_0/Patient/123?_format=json');
    });

    it('appends with a leading & when the URL already has a query string', () => {
        expect(appendFormatJson('/4_0_0/Patient?name=foo')).toBe(
            '/4_0_0/Patient?name=foo&_format=json'
        );
    });
});
