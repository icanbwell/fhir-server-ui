export interface IAuthService {
     
    getLoginUrlAsync(identityProvider: string, resourceUrl: string): Promise<string>;

     
    getLogoutUrlAsync(identityProvider: string): Promise<string>;

     
    fetchTokenAsync(identityProvider: string, code: string, resourceUrl: string): Promise<any>;
}
