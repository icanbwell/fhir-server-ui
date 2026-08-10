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

// Shared by listConnections and listConnectionsForPerson — both endpoints return the same
// raw shape, so this is the single place that maps it to ConnectionEntry.
const mapRawConnections = (json: unknown): ConnectionEntry[] => {
    const rawConnections: RawConnectionEntry[] = Array.isArray(json) ? json : [];
    return rawConnections.map((raw) => ({
        service_slug: raw.value,
        display_name: raw.display,
        category: raw.category,
        status: raw.status,
        expired: raw.expired,
        is_direct: raw.is_direct,
        number_of_resources: raw.number_of_resources,
    }));
};

class TokenServiceApi extends BaseApi {
    // Use for the logged-in member's own connections (a member-authenticated session, e.g.
    // bwellapp). Use listConnectionsForPerson instead to look up an arbitrary person's
    // connections from a service-authenticated session.
    async listConnections(): Promise<{
        status: number | undefined;
        connections: ConnectionEntry[];
    }> {
        const { status, json } = await this.getData({ urlString: '/get-member-connections' });
        return { status, connections: mapRawConnections(json) };
    }

    // Use for the logged-in member's own connection token. Use getConnectionTokenForPerson
    // instead to look up an arbitrary person's connection token from a service-authenticated
    // session.
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

    // Use from a service-authenticated session (cognitocc/descopecc) to look up an
    // arbitrary person's connections by client_fhir_person_id — e.g. staff testing a
    // specific patient's connections. Use listConnections instead for the logged-in
    // member's own connections.
    async listConnectionsForPerson({ clientPersonId }: { clientPersonId: string }): Promise<{
        status: number | undefined;
        connections: ConnectionEntry[];
    }> {
        const { status, json } = await this.getData({
            urlString: `/get-client-person-connections/?client_fhir_person_id=${encodeURIComponent(clientPersonId)}`,
        });
        return { status, connections: mapRawConnections(json) };
    }

    // Use from a service-authenticated session to look up an arbitrary person's
    // connection token by client_fhir_person_id. Use getConnectionToken instead for the
    // logged-in member's own connection token.
    async getConnectionTokenForPerson({
        serviceSlug,
        clientPersonId,
    }: {
        serviceSlug: string;
        clientPersonId: string;
    }): Promise<{
        status: number | undefined;
        connectionToken: ConnectionToken | null;
    }> {
        // Same trailing-slash-before-query-string requirement as getConnectionToken — see that
        // method's comment.
        const { status, json } = await this.getData({
            urlString: `/get-client-person-connection-token/${encodeURIComponent(serviceSlug)}/?client_fhir_person_id=${encodeURIComponent(clientPersonId)}`,
        });
        return { status, connectionToken: status === 200 ? json : null };
    }
}

export default TokenServiceApi;
