import { isTrue } from './isTrue';

class ConfigManager {
  get authEnabled(): boolean {
    return isTrue(process.env.AUTH_ENABLED);
  }
  get EXTERNAL_AUTH_JWKS_URLS(): string {
    return process.env.EXTERNAL_AUTH_JWKS_URLS || '';
  }

  get AUTH_JWKS_URL(): string {
    return process.env.AUTH_JWKS_URL || '';
  }

  get AUTH_ISSUER(): string {
    return process.env.AUTH_ISSUER || '';
  }

  get AUTH_CODE_FLOW_URL(): string {
    return process.env.AUTH_CODE_FLOW_URL || '';
  }

  get AUTH_CODE_FLOW_CLIENT_ID(): string {
    return process.env.AUTH_CODE_FLOW_CLIENT_ID || '';
  }

  get AUTH_CUSTOM_CLIENT_ID(): string {
    return process.env.AUTH_CUSTOM_CLIENT_ID || '';
  }

  get AUTH_CUSTOM_SCOPE(): string {
    return process.env.AUTH_CUSTOM_SCOPE || '';
  }

  get AUTH_CUSTOM_GROUP(): string {
    return process.env.AUTH_CUSTOM_GROUP || '';
  }

  get AUTH_CUSTOM_SUBJECT(): string {
    return process.env.AUTH_CUSTOM_SUBJECT || '';
  }

  get REDIRECT_TO_LOGIN(): boolean {
    return isTrue(process.env.REDIRECT_TO_LOGIN);
  }

  get ENVIRONMENT(): string {
    return process.env.ENVIRONMENT || '';
  }

  get FHIR_SERVER_URL(): string {
    return process.env.FHIR_SERVER_URL || '';
  }
}

export default ConfigManager;
