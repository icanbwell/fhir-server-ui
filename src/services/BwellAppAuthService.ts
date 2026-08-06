import axios from 'axios';

export async function login(
    email: string,
    password: string,
    clientKey: string
): Promise<{ accessToken: string; refreshToken: string }> {
    const baseUrl = import.meta.env.REACT_APP_AUTH_BWELLAPP_BASE_URL;
    if (!baseUrl) {
        throw new Error('REACT_APP_AUTH_BWELLAPP_BASE_URL is not defined');
    }

    const response = await axios.post(
        `${baseUrl}/identity/account/login`,
        { email, password },
        { headers: { clientkey: clientKey } }
    );

    const accessToken = response.data?.accessToken?.jwtToken;
    if (!accessToken) {
        throw new Error('b.well identity API did not return an access token');
    }
    // The FHIR token exchange (see TokenExchangeService) needs the refresh token, not this
    // access token - the gateway's JWT-based exchange path rejects this access token type.
    const refreshToken = response.data?.refreshToken?.token;
    if (!refreshToken) {
        throw new Error('b.well identity API did not return a refresh token');
    }

    return { accessToken, refreshToken };
}

export function parseClientKeys(
    rawClientKeys: string | undefined
): { name: string; key: string }[] {
    if (!rawClientKeys) {
        return [];
    }
    return rawClientKeys
        .split(',')
        .map((pair) => pair.trim())
        .filter((pair) => pair.length > 0)
        .map((pair) => {
            const equalsIndex = pair.indexOf('=');
            if (equalsIndex < 0) {
                return { name: '', key: '' };
            }
            return {
                name: pair.slice(0, equalsIndex).trim(),
                key: pair.slice(equalsIndex + 1).trim(),
            };
        })
        .filter((entry) => entry.name && entry.key);
}
