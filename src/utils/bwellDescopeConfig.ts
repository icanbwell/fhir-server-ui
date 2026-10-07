import { APP_ENV } from '../runtimeEnv';

export const BWELL_DESCOPE_PROVIDER = 'bwelldescope';
export const DEFAULT_BWELL_DESCOPE_FLOW_ID = 'bwell-parent-flow';

export type BwellDescopeConfig = {
    projectId: string;
    flowId: string;
    tenantId?: string;
    baseUrl?: string;
    baseStaticUrl?: string;
};

const readTrimmed = (name: string): string | undefined => APP_ENV[name]?.trim() || undefined;

export const getBwellDescopeConfig = (): BwellDescopeConfig | null => {
    const projectId = readTrimmed('REACT_APP_AUTH_BWELLDESCOPE_PROJECT_ID');
    if (!projectId) {
        return null;
    }
    return {
        projectId,
        flowId:
            readTrimmed('REACT_APP_AUTH_BWELLDESCOPE_FLOW_ID') ?? DEFAULT_BWELL_DESCOPE_FLOW_ID,
        tenantId: readTrimmed('REACT_APP_AUTH_BWELLDESCOPE_TENANT_ID'),
        baseUrl: readTrimmed('REACT_APP_AUTH_BWELLDESCOPE_BASE_URL'),
        baseStaticUrl: readTrimmed('REACT_APP_AUTH_BWELLDESCOPE_BASE_STATIC_URL'),
    };
};
