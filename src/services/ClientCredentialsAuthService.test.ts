import { beforeEach, describe, expect, it, vi } from 'vitest';
import axios from 'axios';
import { getClientCredentialsToken } from './ClientCredentialsAuthService';

vi.mock('axios', () => ({ default: { post: vi.fn() } }));

const mockPost = vi.mocked(axios.post);

describe('getClientCredentialsToken', () => {
    beforeEach(() => {
        mockPost.mockReset();
    });

    it('posts a client_credentials grant and returns the access token', async () => {
        mockPost.mockResolvedValue({ data: { access_token: 'the-token' } });

        const token = await getClientCredentialsToken(
            'https://token.example.com',
            'my-client',
            'my-secret'
        );

        expect(token).toBe('the-token');
        expect(mockPost).toHaveBeenCalledTimes(1);
        const [url, body, config] = mockPost.mock.calls[0];
        expect(url).toBe('https://token.example.com');
        expect(config).toEqual({ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
        const params = body as URLSearchParams;
        expect(params.get('grant_type')).toBe('client_credentials');
        expect(params.get('client_id')).toBe('my-client');
        expect(params.get('client_secret')).toBe('my-secret');
        expect(params.has('scope')).toBe(false);
    });

    it('includes scope in the request body when provided', async () => {
        mockPost.mockResolvedValue({ data: { access_token: 'the-token' } });

        await getClientCredentialsToken('https://token.example.com', 'my-client', 'my-secret', 'read write');

        const params = mockPost.mock.calls[0][1] as URLSearchParams;
        expect(params.get('scope')).toBe('read write');
    });

    it('throws when the token endpoint does not return an access token', async () => {
        mockPost.mockResolvedValue({ data: {} });

        await expect(
            getClientCredentialsToken('https://token.example.com', 'my-client', 'my-secret')
        ).rejects.toThrow('Token endpoint did not return an access token');
    });

    it('propagates request failures', async () => {
        mockPost.mockRejectedValue(new Error('network error'));

        await expect(
            getClientCredentialsToken('https://token.example.com', 'my-client', 'my-secret')
        ).rejects.toThrow('network error');
    });
});
