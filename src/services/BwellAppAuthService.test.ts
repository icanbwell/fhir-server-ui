import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { APP_ENV } from '../runtimeEnv';
import { login, parseClientKeys } from './BwellAppAuthService';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));

const mockPost = vi.mocked(axios.post);

const BASE_URL = 'https://id.example.com';

let envSnapshot: Record<string, string | undefined>;

describe('BwellAppAuthService.login', () => {
    beforeEach(() => {
        mockPost.mockReset();
        envSnapshot = { ...APP_ENV };
        APP_ENV.REACT_APP_AUTH_BWELLAPP_BASE_URL = BASE_URL;
    });

    afterEach(() => {
        Object.keys(APP_ENV).forEach((key) => Reflect.deleteProperty(APP_ENV, key));
        Object.assign(APP_ENV, envSnapshot);
    });

    it('posts the credentials to the identity login endpoint with a lower-case clientkey header', async () => {
        mockPost.mockResolvedValue({ data: { accessToken: { jwtToken: 'jwt-abc' } } });

        await login('user@example.com', 'sup3r-secret', 'client-key-123');

        expect(mockPost).toHaveBeenCalledTimes(1);
        const [url, body, config] = mockPost.mock.calls[0];
        expect(url).toBe('https://id.example.com/identity/account/login');
        expect(body).toEqual({ email: 'user@example.com', password: 'sup3r-secret' });
        // The identity API is case-sensitive about this header name.
        expect(config).toEqual({ headers: { clientkey: 'client-key-123' } });
        expect(Object.keys((config as { headers: Record<string, string> }).headers)).toEqual([
            'clientkey',
        ]);
    });

    it('builds the login url from the configured base url', async () => {
        APP_ENV.REACT_APP_AUTH_BWELLAPP_BASE_URL = 'https://identity.other-env.example.org';
        mockPost.mockResolvedValue({ data: { accessToken: { jwtToken: 'jwt-abc' } } });

        await login('user@example.com', 'pw', 'key');

        expect(mockPost.mock.calls[0][0]).toBe(
            'https://identity.other-env.example.org/identity/account/login'
        );
    });

    it('returns the nested accessToken.jwtToken field', async () => {
        mockPost.mockResolvedValue({
            data: {
                access_token: 'wrong-oauth-style-field',
                accessToken: {
                    jwtToken: 'the-real-jwt',
                    payload: { sub: 'abc' },
                },
            },
        });

        await expect(login('user@example.com', 'pw', 'key')).resolves.toBe('the-real-jwt');
    });

    it('throws (invariant 27) when a 200 response has no accessToken at all', async () => {
        mockPost.mockResolvedValue({ data: {} });

        await expect(login('user@example.com', 'pw', 'key')).rejects.toThrow(
            'b.well identity API did not return an access token'
        );
    });

    it('throws (invariant 27) when accessToken is present but has no jwtToken', async () => {
        mockPost.mockResolvedValue({ data: { accessToken: {} } });

        await expect(login('user@example.com', 'pw', 'key')).rejects.toThrow(
            'b.well identity API did not return an access token'
        );
    });

    it('throws (invariant 27) when jwtToken is an empty string', async () => {
        mockPost.mockResolvedValue({ data: { accessToken: { jwtToken: '' } } });

        await expect(login('user@example.com', 'pw', 'key')).rejects.toThrow(
            'b.well identity API did not return an access token'
        );
    });

    it('fails closed without contacting the identity API when the base url is not configured', async () => {
        delete APP_ENV.REACT_APP_AUTH_BWELLAPP_BASE_URL;

        await expect(login('user@example.com', 'pw', 'key')).rejects.toThrow(
            'REACT_APP_AUTH_BWELLAPP_BASE_URL is not defined'
        );
        expect(mockPost).not.toHaveBeenCalled();
    });

    it('propagates a rejected POST (network failure or 401) to the caller', async () => {
        mockPost.mockRejectedValue(new Error('Request failed with status code 401'));

        await expect(login('user@example.com', 'pw', 'key')).rejects.toThrow(
            'Request failed with status code 401'
        );
    });

    it('never puts the email or password in the url or the headers', async () => {
        mockPost.mockResolvedValue({ data: { accessToken: { jwtToken: 'jwt-abc' } } });

        await login('leaky@example.com', 'do-not-log-me', 'client-key-123');

        const [url, body, config] = mockPost.mock.calls[0];
        expect(url as string).not.toContain('leaky@example.com');
        expect(url as string).not.toContain('do-not-log-me');
        const serialisedHeaders = JSON.stringify(config);
        expect(serialisedHeaders).not.toContain('leaky@example.com');
        expect(serialisedHeaders).not.toContain('do-not-log-me');
        expect(body).toEqual({ email: 'leaky@example.com', password: 'do-not-log-me' });
    });
});

describe('BwellAppAuthService.parseClientKeys (invariant 26 - parsing is total)', () => {
    it('returns an empty list for undefined and for an empty string', () => {
        expect(parseClientKeys(undefined)).toEqual([]);
        expect(parseClientKeys('')).toEqual([]);
    });

    it('parses a single name=key pair', () => {
        expect(parseClientKeys('acme=abc123')).toEqual([{ name: 'acme', key: 'abc123' }]);
    });

    it('parses multiple comma-separated pairs in order', () => {
        expect(parseClientKeys('acme=abc123,globex=def456,initech=ghi789')).toEqual([
            { name: 'acme', key: 'abc123' },
            { name: 'globex', key: 'def456' },
            { name: 'initech', key: 'ghi789' },
        ]);
    });

    it('trims surrounding whitespace from both the name and the key', () => {
        expect(parseClientKeys('  acme  =  abc123  ,\n globex = def456 ')).toEqual([
            { name: 'acme', key: 'abc123' },
            { name: 'globex', key: 'def456' },
        ]);
    });

    it('drops trailing commas and empty segments', () => {
        expect(parseClientKeys('acme=abc123,,globex=def456,')).toEqual([
            { name: 'acme', key: 'abc123' },
            { name: 'globex', key: 'def456' },
        ]);
        expect(parseClientKeys(',,,')).toEqual([]);
    });

    it('drops an entry that has no "=" separator', () => {
        expect(parseClientKeys('acme=abc123,justaname,globex=def456')).toEqual([
            { name: 'acme', key: 'abc123' },
            { name: 'globex', key: 'def456' },
        ]);
        expect(parseClientKeys('justaname')).toEqual([]);
    });

    it('drops entries with an empty name or an empty key so no blank clientkey is ever sent', () => {
        expect(parseClientKeys('=abc123')).toEqual([]);
        expect(parseClientKeys('acme=')).toEqual([]);
        expect(parseClientKeys('   =   ')).toEqual([]);
        expect(parseClientKeys('=abc,acme=,globex=def456')).toEqual([
            { name: 'globex', key: 'def456' },
        ]);
    });

    it('splits on the first "=" only, so a key containing "=" keeps its full value (invariant 7)', () => {
        expect(parseClientKeys('acme=abc=123==')).toEqual([{ name: 'acme', key: 'abc=123==' }]);
        expect(parseClientKeys('acme=eyJhbGc9==,globex=x=y')).toEqual([
            { name: 'acme', key: 'eyJhbGc9==' },
            { name: 'globex', key: 'x=y' },
        ]);
    });

    it('never throws for malformed operator input', () => {
        const malformedInputs = [
            ',',
            '===',
            '   ',
            '=',
            'a=b=c,,,=,=x,y=',
            '\n\t,\n',
            'acme==abc',
        ];

        malformedInputs.forEach((input) => {
            expect(() => parseClientKeys(input)).not.toThrow();
            expect(Array.isArray(parseClientKeys(input))).toBe(true);
        });

        // '===' has a first '=' at index 0, so the name is empty and it is dropped.
        expect(parseClientKeys('===')).toEqual([]);
        // 'acme==abc' splits at the first '=', keeping '=abc' as the key.
        expect(parseClientKeys('acme==abc')).toEqual([{ name: 'acme', key: '=abc' }]);
    });
});
