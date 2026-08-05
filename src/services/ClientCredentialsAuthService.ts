import axios from 'axios';

export async function getClientCredentialsToken(
    tokenUrl: string,
    clientId: string,
    clientSecret: string,
    scope?: string
): Promise<string> {
    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
    });
    if (scope) {
        body.append('scope', scope);
    }

    const response = await axios.post(tokenUrl, body, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const accessToken = response.data?.access_token;
    if (!accessToken) {
        throw new Error('Token endpoint did not return an access token');
    }

    return accessToken;
}
