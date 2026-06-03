const TIMEOUT_LIMIT = 2147483647 as const;

export type UserIdentity<TClaims extends Record<string, any>> = {
    claims: TClaims;
    token: string;
    expiration?: Date;
};

export type TokenStorage = {
    get: () => string | null;
    put: (token: string) => void;
    clear: () => void;
}

export type IdentityServiceOptions<TClaims extends Record<string, any>> = {
    onUserChange?: (state: UserIdentity<TClaims> | null) => void;
};

export type IdentityServiceConfigurationOptions<TClaims extends Record<string, any>> = {
    onUserChange?: (state: UserIdentity<TClaims> | null) => void;
    onFailedParsing?: (error: any) => void;
    parser?: (token: string) => TClaims;
    hydrator?: (tokenBody: any) => TClaims;
    storage: TokenStorage;
    useStandardJwtExp?: boolean;
}

export type IdentityService<TClaims extends Record<string, any>> = {
    user: UserIdentity<TClaims> | null;
    setToken: (token: string, expiration?: Date) => void;
    clearToken: () => void;
};

// Level 1: Application (Definition)
function configureIdentityService<TClaims extends Record<string, any>>
    (configurationOptions: IdentityServiceConfigurationOptions<TClaims>)
    : (serviceOptions?: IdentityServiceOptions<TClaims>) => IdentityService<TClaims> {
    
    if (!configurationOptions.parser && !configurationOptions.hydrator) {
        throw new Error("At least one of 'parser' or 'hydrator' must be defined");
    }

    let user: UserIdentity<TClaims> | null = null;
    let timeoutId: number | null = null;

    function parseClaims(jwtToken: string | null): TClaims | null {
        if (jwtToken === null) return null;
        
        try {
            if (configurationOptions.parser) {
                return configurationOptions.parser(jwtToken);
            }

            // Base64 padding safety
            let tokenBody = jwtToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
            const pad = tokenBody.length % 4;
            if (pad) tokenBody += "=".repeat(4 - pad);

            const bytes = Uint8Array.from(atob(tokenBody), (m) => m.codePointAt(0)!);
            const jsonString = new TextDecoder().decode(bytes);
            const jsonObj = jsonString ? JSON.parse(jsonString) : jsonString;

            if (configurationOptions.hydrator) {
                return configurationOptions.hydrator(jsonObj);
            }
            throw new Error("Invalid state. Either tokenParser or userHydrator must be defined");
        } catch (error) {
            if (configurationOptions.onFailedParsing) {
                configurationOptions.onFailedParsing(error);
            }
            return null;
        }
    }
    
    // Level 2: Context (Factory)
    return function createService(serviceOptions?: IdentityServiceOptions<TClaims>): IdentityService<TClaims> {

        function internalSetToken (token: string | null, expiration?: Date): void {
            if (token === user?.token) {
                return;
            }
            const claims = parseClaims(token);
            if (!token || !claims) {
                user = null;
                setExpiration(undefined);
                configurationOptions.storage.clear();
            }
            else {
                user = {token, claims};
                let finalExpiration = expiration;
                if (configurationOptions.useStandardJwtExp && !finalExpiration && typeof (claims as any).exp === 'number') {
                    finalExpiration = new Date((claims as any).exp * 1000);
                }
                setExpiration(finalExpiration);
                configurationOptions.storage.put(token);
            }
            if (serviceOptions?.onUserChange) {
                serviceOptions.onUserChange(user);
            }
            if (configurationOptions.onUserChange) {
                configurationOptions.onUserChange(user);
            }
        }
    
        function setExpiration(expiration?: Date) {
    
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (!expiration) {
                timeoutId = null;
                return;
            };
    
            const expirationMillis = expiration.getTime();
            const now = Date.now();
    
            if (expirationMillis < now) {
                internalSetToken(null);
                return;
            }
    
            let timeout = expirationMillis - now;
            
            if (timeout > TIMEOUT_LIMIT) {
                timeoutId = setTimeout(() => setExpiration(expiration), TIMEOUT_LIMIT);
                return;
            }
            
            if (user) {
                user.expiration = new Date(now + timeout);
            }
    
            timeoutId = setTimeout(() => internalSetToken(null), timeout);
        }
        return {
            get user(): UserIdentity<TClaims> | null {
                return user;
            },
            setToken: internalSetToken,
            clearToken: () => internalSetToken(null),
        };
    }
}

export const IdentityService = {
    specify: configureIdentityService,
}