import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { LRUCache } from 'lru-cache';

/**
 * Well-known configuration information interface
 */
interface WellKnownConfigurationInfo {
    authorization_endpoint: string | undefined;
    token_endpoint: string | undefined;
    userinfo_endpoint: string | undefined;
    jwks_uri: string | undefined;
    issuer: string | undefined;
    end_session_endpoint: string | undefined;
    scopes_supported: string[] | undefined;
    response_types_supported: string[] | undefined;
    token_endpoint_auth_methods_supported: string[] | undefined;
    revocation_endpoint: string | undefined;
    introspection_endpoint: string | undefined;
}

/**
 * Cache options interface
 */
interface CacheOptions {
    max?: number;
    ttl?: number;
}

/**
 * Well-known configuration manager
 */
class WellKnownConfigurationService {
    /**
     * Static cache for configuration data
     */
    private static cache: LRUCache<string, WellKnownConfigurationInfo>;

    /**
     * Axios instance for making HTTP requests
     */
    private readonly axiosInstance: AxiosInstance;

    /**
     * Constructor
     * @param configManager Configuration manager
     * @param cacheOptions Optional cache configuration
     */
    constructor({ cacheOptions }: { cacheOptions?: CacheOptions }) {
        // Create Axios instance with default config
        this.axiosInstance = axios.create({
            headers: {
                Accept: 'application/json',
            },
            timeout: 10000, // 10 seconds timeout
        });

        if (!WellKnownConfigurationService.cache) {
            WellKnownConfigurationService.cache = new LRUCache<string, WellKnownConfigurationInfo>({
                max: cacheOptions?.max ?? 100,
                ttl: cacheOptions?.ttl ?? 60 * 60 * 1000, // Default 1 hour
            });
        }
    }

    /**
     * Extract specific fields from configuration data
     * @param config Raw configuration object
     * @returns Extracted configuration details
     */
    private extractConfigurationDetails(config: any): WellKnownConfigurationInfo {
        if (!config || typeof config !== 'object') {
            throw new Error('Invalid configuration data');
        }

        return {
            authorization_endpoint: config.authorization_endpoint,
            token_endpoint: config.token_endpoint,
            userinfo_endpoint: config.userinfo_endpoint,
            jwks_uri: config.jwks_uri,
            issuer: config.issuer,
            end_session_endpoint: config.end_session_endpoint,
            scopes_supported: config.scopes_supported || [],
            response_types_supported: config.response_types_supported || [],
            token_endpoint_auth_methods_supported: config.token_endpoint_auth_methods_supported || [],
            revocation_endpoint: config.revocation_endpoint,
            introspection_endpoint: config.introspection_endpoint,
        };
    }

    /**
     * Fetch configuration data from a given URL
     * @param url Configuration endpoint URL
     * @returns Fetched configuration data
     */
    async fetchConfigurationAsync(url: string): Promise<WellKnownConfigurationInfo> {
        // Check cache first
        const cachedConfig = WellKnownConfigurationService.cache.get(url);
        if (cachedConfig) {
            return cachedConfig;
        }

        try {
            // Fetch configuration
            const response: AxiosResponse = await this.axiosInstance.get(url);

            const extractedData = this.extractConfigurationDetails(response.data);

            // Cache the extracted data
            WellKnownConfigurationService.cache.set(url, extractedData);

            return extractedData;
        } catch (error) {
            // Improved error handling
            if (axios.isAxiosError(error)) {
                throw new Error(
                    `Failed to fetch configuration from ${url}: ${error.response?.data || error.message}`
                );
            }
            throw new Error(
                `Failed to fetch configuration from ${url}: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }
}

export { WellKnownConfigurationService };
export type { WellKnownConfigurationInfo };
