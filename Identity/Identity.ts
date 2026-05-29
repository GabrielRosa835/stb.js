const TIMEOUT_LIMIT = 2147483647 as const;

export type IdentityState<TClaims extends Record<string, any>> = {
    claims: TClaims;
    token: string;
    expiration?: Date;
};

export type TokenStorage = {
    get: () => string | null;
    put: (token: string) => void;
    clear: () => void;
}

export type IdentityOptions<
    TClaims extends Record<string, any>,
> = {
    onUserChange?: (state: IdentityState<TClaims> | null) => void;
    onFailedParsing?: (error: any) => void;
    parser?: (token: string) => TClaims;
    hydrator?: (tokenBody: any) => TClaims;
    storage: TokenStorage;
    printConsole: boolean;
};

export type IdentityService<TClaims extends Record<string, any>> = {
    user: IdentityState<TClaims> | null;
    setToken: (token: string, expiration?: Date) => void;
    clearToken: () => void;
};

// Level 1: Application (Definition)
export function configureIdentityProvider<
    TClaims extends Record<string, any>
>(options: IdentityOptions<TClaims>): () => IdentityService<TClaims> {
    
    if (!options.parser && !options.hydrator) {
        if (options.printConsole) {
            console.error("At least one of 'parser' or 'hydrator' must be defined");
        }
        throw new Error("At least one of 'parser' or 'hydrator' must be defined");
    }

    function parseClaims(jwtToken: string | null): TClaims | null {
        if (jwtToken === null) return null;
        
        try {
            if (options.parser) {
                return options.parser(jwtToken);
            }

            const tokenBody = jwtToken.split(".")[1].replace("-", "+").replace("_", "/");
            const bytes = Uint8Array.from(atob(tokenBody), (m) => m.codePointAt(0)!);
            const jsonString = new TextDecoder().decode(bytes);
            const jsonObj = jsonString ? JSON.parse(jsonString) : jsonString;

            if (options.hydrator) {
                return options.hydrator(jsonObj);
            }
            if (options.printConsole) {
                console.error("Invalid state. Either tokenParser or userHydrator must be defined");
            }
            throw new Error("Invalid state. Either tokenParser or userHydrator must be defined");
        } catch (error) {
            if (options.onFailedParsing) {
                options.onFailedParsing(error);
            }
            return null;
        }
    }

    let state: IdentityState<TClaims> | null = null;
    function setUser(value: IdentityState<TClaims> | null): void {
        state = value;
        if (options.onUserChange) {
            options.onUserChange(value);
        }
    }

    function setToken(token: string | null): void {
        if (token === state?.token) {
            return;
        }
        if (!token) {
            setUser(null);
            return;
        }
        const claims = parseClaims(token);
        if (!claims) {
            setUser(null);
            return;
        }
        setUser({ token, claims });
    }

    let timeoutId: number | null = null;

    function setExpiration(expiration?: Date) {
        if (timeoutId) clearTimeout(timeoutId);
        if (!expiration) {
            timeoutId = null;
            return;
        };

        const expirationMillis = expiration.getTime();
        const now = Date.now();

        if (expirationMillis < now) {
            clearToken();
            return;
        }

        let timeout = expirationMillis - now;
        
        if (timeout > TIMEOUT_LIMIT) {
            console.warn("Token expiration exceeds setTimeout limit.");
            timeout = TIMEOUT_LIMIT;
        }
        
        if (state) {
            state.expiration = new Date(now + timeout);
        }
        timeoutId = setTimeout(clearToken, timeout);
    }

    const clearToken = (): void => {
        setExpiration(undefined);
        options.storage.clear();
        setToken(null);
    };
    // --- Level 3: Execution (Methods) ---
    const publicSetToken = (token: string, expiration?: Date): void => {
        options.storage.put(token);
        setToken(token);
        setExpiration(expiration);
    };
    
    // Level 2: Context (Factory)
    return function createIdentityService(): IdentityService<TClaims> {

        // --- Initialization ---
        // Read from storage and hydrate the injected observer on startup
        const initialToken = options.storage.get();
        setToken(initialToken);
        setExpiration();

        return {
            // Provide a safe fallback if the observer is queried before initialization is completely finished
            get user(): IdentityState<TClaims> | null {
                return state;
            },
            setToken: publicSetToken,
            clearToken: clearToken,
        };
    }
}