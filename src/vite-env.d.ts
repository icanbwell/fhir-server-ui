/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly REACT_APP_SENTRY_DSN?: string;
  readonly REACT_APP_ENVIRONMENT?: string;
  readonly REACT_APP_FHIR_SERVER_URL?: string;
  readonly REACT_APP_TOKEN_EXCHANGE_GRAPHQL_URL?: string;
  readonly REACT_APP_AUTH_PROVIDERS?: string;
  readonly REACT_APP_VERSION?: string;
  readonly REACT_APP_AWS_REGION?: string;
  readonly REACT_APP_AUTH_REDIRECT_PATH?: string;
  readonly REACT_APP_AUTH_REDIRECT_STATE?: string;
  readonly [key: string]: string | undefined;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
