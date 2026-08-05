import axios from 'axios';

export async function login(
    email: string,
    password: string,
    clientKey: string
): Promise<string> {
    const baseUrl = import.meta.env.REACT_APP_AUTH_BWELLAPP_BASE_URL;
    if (!baseUrl) {
        throw new Error('REACT_APP_AUTH_BWELLAPP_BASE_URL is not defined');
    }

    const response = await axios.post(
        `${baseUrl}/identity/account/login`,
        { email, password },
        { headers: { clientkey: clientKey } }
    );

    const jwtToken = response.data?.accessToken?.jwtToken;
    if (!jwtToken) {
        throw new Error('b.well identity API did not return an access token');
    }

    return jwtToken;
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
            const [name, key] = pair.split('=').map((s) => s.trim());
            return { name, key };
        })
        .filter((entry) => entry.name && entry.key);
}
