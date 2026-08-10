import BaseApi from './baseApi';
import { ConnectionEntry, ConnectionToken } from '../types/connectionEntry';

interface RawConnectionEntry {
    value: string;
    display: string;
    category: string;
    status: string;
    expired: boolean;
    is_direct: boolean;
    number_of_resources: number;
}

class TokenServiceApi extends BaseApi {
    async listConnections(): Promise<{
        status: number | undefined;
        connections: ConnectionEntry[];
    }> {
        const { status, json } = await this.getData({ urlString: '/get-member-connections' });
        const rawConnections: RawConnectionEntry[] = Array.isArray(json) ? json : [];
        return {
            status,
            connections: rawConnections.map((raw) => ({
                service_slug: raw.value,
                display_name: raw.display,
                category: raw.category,
                status: raw.status,
                expired: raw.expired,
                is_direct: raw.is_direct,
                number_of_resources: raw.number_of_resources,
            })),
        };
    }

    async getConnectionToken({ serviceSlug }: { serviceSlug: string }): Promise<{
        status: number | undefined;
        connectionToken: ConnectionToken | null;
    }> {
        // Trailing slash before the path ends is required: this endpoint 307-redirects a
        // request missing it (FastAPI's default redirect_slashes behavior), and a redirect
        // can drop the Authorization header depending on the HTTP client.
        const { status, json } = await this.getData({
            urlString: `/get-member-connection-token/${encodeURIComponent(serviceSlug)}/`,
        });
        return { status, connectionToken: status === 200 ? json : null };
    }
}

export default TokenServiceApi;
