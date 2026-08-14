import {
    WellKnownConfigurationInfo,
    WellKnownConfigurationService,
} from '../services/WellKnownConfigurationService';
import { APP_ENV } from '../runtimeEnv';

class AuthUrlProvider {
    async getAuthUrlsAsync(provider: string): Promise<{
        authorizeUrl: string;
        tokenUrl: string;
        logoutUrl?: string;
        wellKnownUrl?: string;
    }> {
        const wellKnownUrl = APP_ENV[`REACT_APP_AUTH_${provider.toUpperCase()}_WELL_KNOWN_URL`];
        let authorizeUrl: string | undefined;
        let tokenUrl: string | undefined;
        let logoutUrl: string | undefined;
        // if wellKnownUrl is defined, use it to get the authorizeUrl and tokenUrl
        if (wellKnownUrl) {
            const wellKnownConfigurationService: WellKnownConfigurationService =
                new WellKnownConfigurationService({});
            const wellKnownConfig: WellKnownConfigurationInfo =
                await wellKnownConfigurationService.fetchConfigurationAsync(wellKnownUrl);
            authorizeUrl = wellKnownConfig.authorization_endpoint;
            tokenUrl = wellKnownConfig.token_endpoint;
            logoutUrl = wellKnownConfig.end_session_endpoint;
        } else {
            // otherwise, use the environment variables
            authorizeUrl = APP_ENV[`REACT_APP_AUTH_${provider.toUpperCase()}_AUTHORIZE_URL`];
            tokenUrl = APP_ENV[`REACT_APP_AUTH_${provider.toUpperCase()}_TOKEN_URL`];
            logoutUrl = APP_ENV[`REACT_APP_AUTH_${provider.toUpperCase()}_LOGOUT_URL`];
        }

        if (!authorizeUrl) {
            throw new Error(
                `REACT_APP_AUTH_${provider.toUpperCase()}_AUTHORIZE_URL is not defined`
            );
        }
        if (!tokenUrl) {
            throw new Error(`REACT_APP_AUTH_${provider.toUpperCase()}_TOKEN_URL is not defined`);
        }
        if (!logoutUrl) {
            throw new Error(`REACT_APP_AUTH_${provider.toUpperCase()}_LOGOUT_URL is not defined`);
        }
        if (!wellKnownUrl) {
            throw new Error(`REACT_APP_AUTH_${provider.toUpperCase()}_LOGOUT_URL is not defined`);
        }

        return {
            authorizeUrl,
            tokenUrl,
            logoutUrl,
            wellKnownUrl,
        };
    }

    getAuthInfo(provider: string): {
        customUserName?: string;
        customGroup?: string;
        customScope?: string;
        clientId: string;
        tokenForUserDetails: string;
        tokenToSendToFhirServer?: string;
        scopeRemovePrefix?: string[];
        loginScopes?: string;
    } {
        const customUserName =
            APP_ENV[`REACT_APP_AUTH_${provider.toUpperCase()}_CUSTOM_USERNAME`];
        const customGroup = APP_ENV[`REACT_APP_AUTH_${provider.toUpperCase()}_CUSTOM_GROUP`];
        const customScope = APP_ENV[`REACT_APP_AUTH_${provider.toUpperCase()}_CUSTOM_SCOPE`];
        const clientId = APP_ENV[`REACT_APP_AUTH_${provider.toUpperCase()}_CLIENT_ID`];
        const tokenForUserDetails =
            APP_ENV[`REACT_APP_AUTH_${provider.toUpperCase()}_TOKEN_FOR_USER_DETAILS`];
        const scopeRemovePrefixValue =
            APP_ENV[`REACT_APP_AUTH_${provider.toUpperCase()}_REMOVE_SCOPE_PREFIX`];
        const scopeRemovePrefix = scopeRemovePrefixValue
            ? scopeRemovePrefixValue.split(',').map((s) => s.trim())
            : undefined;
        const loginScopes = APP_ENV[`REACT_APP_AUTH_${provider.toUpperCase()}_LOGIN_SCOPES`];

        if (!customUserName) {
            throw new Error(
                `REACT_APP_AUTH_${provider.toUpperCase()}_CUSTOM_USERNAME is not defined`
            );
        }
        if (!customGroup) {
            throw new Error(`REACT_APP_AUTH_${provider.toUpperCase()}_CUSTOM_GROUP is not defined`);
        }
        if (!customScope) {
            throw new Error(`REACT_APP_AUTH_${provider.toUpperCase()}_CUSTOM_SCOPE is not defined`);
        }
        if (!clientId) {
            throw new Error(`REACT_APP_AUTH_${provider.toUpperCase()}_CLIENT_ID is not defined`);
        }
        if (!tokenForUserDetails) {
            throw new Error(`REACT_APP_AUTH_${provider.toUpperCase()}_TOKEN_FOR_USER_DETAILS is not defined`);
        }

        let tokenToSendToFhirServer =
            APP_ENV[`REACT_APP_AUTH_${provider.toUpperCase()}_TOKEN_TO_SEND_TO_FHIR_SERVER`];

        if (!tokenToSendToFhirServer) {
            tokenToSendToFhirServer = 'jwt';
        }

        return {
            customUserName,
            customGroup,
            customScope,
            clientId,
            tokenForUserDetails,
            tokenToSendToFhirServer,
            scopeRemovePrefix,
            loginScopes
        };
    }
}

export default AuthUrlProvider;
