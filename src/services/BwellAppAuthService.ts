import axios from 'axios';
import { APP_ENV } from '../runtimeEnv';

export async function login(
    email: string,
    password: string,
    clientKey: string
): Promise<string> {
    const baseUrl = APP_ENV.REACT_APP_AUTH_BWELLAPP_BASE_URL;
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
