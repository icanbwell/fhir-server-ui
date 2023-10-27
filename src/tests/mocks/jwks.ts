import nock from 'nock';
import * as jose from 'jose';
import async from 'async';

/**
 * creates a mock endpoint for /.well-known/jwks.json
 * @param {string} host
 * @param {string} path
 * @param {[{pub: string, kid: string}]} certs
 * @return {nock.Scope}
 */
export function jwksEndpoint(
  host: string,
  path: string,
  certs: { pub: string; kid: string }[],
): nock.Scope {
  return nock(host)
    .persist()
    .get(`${path}`)
    .reply((uri, requestBody, cb) => {
      async
        .map(certs, async (cert: { pub: string; kid: string }) => {
          const parsed = await jose.importSPKI(cert.pub, 'ES256');
          const publicJwk = await jose.exportJWK(parsed);
          return {
            alg: 'RS256',
            e: publicJwk.e,
            n: publicJwk.n,
            kty: publicJwk.kty,
            use: 'sig',
            kid: cert.kid,
          };
        })
        .then((keys) => cb(null, [200, { keys: keys }]));
    });
}

/**
 * creates a mock endpoint for /.well-known/openid-configuration
 * @param {string} host
 * @return {nock.Scope}
 */
export function jwksDiscoveryEndpoint(host: string): nock.Scope {
  return nock(host)
    .persist()
    .get('/.well-known/openid-configuration')
    .reply(200, {
      id_token_signing_alg_values_supported: ['RS256'],
      issuer: host,
      jwks_uri: `${host}/.well-known/jwks.json`,
      response_types_supported: ['code', 'token'],
      scopes_supported: ['openid', 'email', 'phone', 'profile'],
      subject_types_supported: ['public'],
      userinfo_endpoint: `${host}/userInfo`,
    });
}

/**
 * creates a mock endpoint for /.well-known/openid-configuration
 */
export function jwksUserInfoEndpoint({
  host,
  token,
  patientId,
  personId,
}: {
  host: string;
  token: string;
  patientId: string;
  personId: string;
}): nock.Scope {
  // noinspection SpellCheckingInspection
  return nock(host, {
    reqheaders: {
      authorization: `Bearer ${token}`,
    },
  })
    .persist()
    .get('/userInfo')
    .reply(200, () => {
      return {
        'custom:bwellFhirPatientId': patientId,
        'custom:bwellFhirPersonId': personId,
        sub: 'f559569d-a6c8-4f70-8447-489b42f48b07',
        email_verified: 'true',
        'custom:clientFhirPersonId': personId,
        'custom:clientFhirPatientId': patientId,
        email: 'imran@icanbwell.com',
        username: 'bwell-demo-provider',
      };
    });
}
