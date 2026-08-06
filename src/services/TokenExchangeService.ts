import axios from 'axios';

// A b.well identity gateway login token is an intermediate credential, not a FHIR-server-valid
// one - it must be exchanged for the access token the FHIR server actually accepts.
//
// The gateway's getToken resolver requires BOTH an `authorization` header (the login access
// token) AND a `refresh_token` header (the login refresh token, a JWE) together:
// - authorization alone: TokenProcessor.handleJwtToken -> JwtService.validateJwtClientRecord
//   rejects it with "Invalid client configuration" for this credential type.
// - refresh_token alone: rejected with "Authorization header not found" (confirmed directly
//   against the real dev gateway - a real successful call in Groundcover appearing to omit
//   `authorization` was misleading, since that header is redacted from logs for every caller,
//   including ones independently confirmed to succeed).
// mcp-fhir-agent's own TokenExchangeManager only sends authorization, which is necessary but not
// sufficient here - don't drop back to that shape either.
const GET_TOKEN_QUERY = `query authenticate {
  getToken {
    accessToken {
      jwtToken
    }
  }
}`;

export async function exchangeToken(
    accessToken: string,
    refreshToken: string,
    clientKey: string
): Promise<string> {
    const url = import.meta.env.REACT_APP_TOKEN_EXCHANGE_GRAPHQL_URL;
    if (!url) {
        throw new Error('REACT_APP_TOKEN_EXCHANGE_GRAPHQL_URL is not defined');
    }

    const response = await axios.post(
        url,
        { query: GET_TOKEN_QUERY },
        {
            headers: {
                authorization: `Bearer ${accessToken}`,
                refresh_token: refreshToken,
                clientkey: clientKey,
                'content-type': 'application/json',
            },
        }
    );

    const exchangedAccessToken = response.data?.data?.getToken?.accessToken?.jwtToken;
    if (!exchangedAccessToken) {
        const gqlErrors = response.data?.errors;
        const reason = Array.isArray(gqlErrors) && gqlErrors.length > 0
            ? gqlErrors.map((e: any) => e?.message).filter(Boolean).join('; ')
            : undefined;
        throw new Error(
            reason
                ? `Token exchange failed: ${reason}`
                : 'Token exchange did not return an access token'
        );
    }

    return exchangedAccessToken;
}
