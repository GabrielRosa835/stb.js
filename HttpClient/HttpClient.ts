// Base type to keep configurations DRY across all 3 levels

/**
 * Base configuration options shared across all three configuration levels
 * (Application, Context, and Request).
 * Options defined at lower (more specific) levels override those defined at higher levels.
 */
export type HttpOptions = {
    /** Hook to intercept and modify the request before it is sent.
     * Useful for injecting dynamic headers like Authentication tokens.
     */
    requestInterceptor?: (url: string, options: RequestInit) => Promise<RequestInit> | RequestInit;
    /** Hook to intercept and modify the raw fetch Response before it is handled.
     * Useful for global error logging or refreshing expired tokens.
     */
    responseInterceptor?: (response: Response) => Promise<Response> | Response;
    /** Custom handler to parse the final response. 
     * Defaults to throwing on non-ok statuses and parsing JSON.
     */
    responseHandler?: (response: Response) => Promise<any>;
    /** Standard fetch RequestInit options (e.g., headers, mode, credentials). */
    requestOptions?: RequestInit;
};

/** Options applied at the root Application level. */
export type HttpClientConfigurationOptions = HttpOptions & {
    /** The base URL prepended to all relative endpoint paths. */
    baseUrl: string;
};
/** Options applied at the specific Context level (e.g., a specific domain service). */
export type HttpClientOptions = HttpOptions & {
    /** The URL suffix to be used on top of `baseUrl`. Normally attributed to a Controller */
    urlSuffix?: string;
};
/** Options applied to a single, specific HTTP request. */
export type RequestOptions = HttpOptions;

/**
 * The core HTTP Client interface exposing standard REST methods.
 */
export type HttpClient = {
    /** Sends a GET request to the specified endpoint. */
    get: <TResult = void>(endpoint?: string, options?: RequestOptions) => Promise<TResult>;
    /** Sends a POST request with an optional body. */
    post: <TResult = void>(endpoint?: string, body?: any, options?: RequestOptions) => Promise<TResult>;
    /** Sends a PUT request with an optional body. */
    put: <TResult = void>(endpoint?: string, body?: any, options?: RequestOptions) => Promise<TResult>;
    /** Sends a DELETE request with an optional body. */
    delete: <TResult = void>(endpoint?: string, body?: any, options?: RequestOptions) => Promise<TResult>;
    /** Sends a PATCH request with an optional body. */
    patch: <TResult = void>(endpoint?: string, body?: any, options?: RequestOptions) => Promise<TResult>;
}

/**
 * Level 1: Application (Definition)
 * 
 * **PURPOSE:**
 * This is the highest level of the configuration cascade. It establishes global HTTP 
 * behaviors that should apply uniformly across your entire application. By defining 
 * settings here (such as injecting global Authorization tokens, setting up global 
 * error logging, or defining a primary API base URL), you keep your codebase DRY 
 * and prevent repetitive configuration.
 * 
 * **HOW THE CASCADE WORKS:**
 * Settings provided at this Level 1 act as the ultimate fallback. They are inherited 
 * by every client created through the returned factory. However, any setting defined 
 * here can be cleanly overridden by providing a more specific configuration at Level 2 
 * (Context) or Level 3 (Request).
 * @param configurationOptions - Global fallback configurations (e.g., universal headers, root base URL).
 * @returns A factory function (Level 2) tailored to create context-specific clients.
 */
function configureHttpClient(configurationOptions: HttpClientConfigurationOptions): (contextOptions?: HttpClientOptions) => HttpClient {

    if (configurationOptions.baseUrl || configurationOptions.baseUrl.trim() === "") {
        throw new Error("A baseUrl is required to send requests.");
    }
    
    async function defaultResponseHandler(response: Response): Promise<any> {
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        // Handle 204 No Content or empty bodies safely
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }
    
    // Merge App Level and Context Level (Context wins)
    const mergeOptions = (appConfig: HttpClientConfigurationOptions) => (ctxConfig?: HttpClientOptions) => ({
        requestInterceptor: ctxConfig?.requestInterceptor ?? appConfig?.requestInterceptor,
        responseInterceptor: ctxConfig?.responseInterceptor ?? appConfig?.responseInterceptor,
        responseHandler: ctxConfig?.responseHandler ?? appConfig?.responseHandler,
        requestOptions: {
            ...appConfig?.requestOptions,
            ...ctxConfig?.requestOptions,
            headers: {
                ...appConfig?.requestOptions?.headers,
                ...ctxConfig?.requestOptions?.headers,
            }
        }
    });

    // Helper to merge Context Level and Request Level (Request wins)
    const resolveConfig = (ctxConfig?: HttpClientOptions) => (reqOptions?: RequestOptions) => {
        return {
            requestInterceptor: reqOptions?.requestInterceptor ?? ctxConfig?.requestInterceptor,
            responseInterceptor: reqOptions?.responseInterceptor ?? ctxConfig?.responseInterceptor,
            responseHandler: reqOptions?.responseHandler ?? ctxConfig?.responseHandler ?? defaultResponseHandler,
            requestOptions: {
                ...ctxConfig?.requestOptions,
                ...reqOptions?.requestOptions,
                headers: {
                    ...ctxConfig?.requestOptions?.headers,
                    ...reqOptions?.requestOptions?.headers,
                }
            }
        };
    };
    
    /**
     * Level 2: Context (Factory)
     * 
     * **PURPOSE:**
     * This function instantiates the actual HTTP client object (exposing `get`, `post`, etc.). 
     * It is designed to represent a specific "Context" or "Domain" within your application—for 
     * example, creating a dedicated `UsersClient` that always hits `/users`, or a `BillingClient` 
     * that requires a unique set of headers.
     * 
     * **HOW THE CASCADE WORKS:**
     * Settings provided at this Level 2 sit in the middle of the cascade. They will automatically 
     * override any overlapping configurations inherited from Level 1 (Application). In turn, 
     * these Context settings act as the default values for Level 3 (individual Requests), meaning 
     * a one-off request can still override them if needed.
     * 
     * * **Note:** If your application is small and doesn't require global (Level 1) configuration, 
     * you can bypass `defineHttpClient` and use this function directly to create your client.
     * 
     * @param contextConfig - Configurations bound to this specific domain/service.
     * @returns An initialized `HttpClient` ready to execute network requests.
     */
    return function createClient(clientOptions?: HttpClientOptions): HttpClient {

        const mergedOptions = mergeOptions(configurationOptions)(clientOptions);

        /**
         * Level 3: Request (Execution)
         * Core execution pipeline for all HTTP methods. Handles configuration resolution,
         * URL construction, headers merging, and interceptor execution.
         */
        async function request<TResult = any>(method: string, endpoint?: string, body?: any, reqOptions?: RequestOptions): Promise<TResult> {

            const config = resolveConfig(mergedOptions)(reqOptions);

            // Clean up URL concatenation to prevent double slashes
            const baseUrl = configurationOptions.baseUrl?.replace(/\/$/, '') ?? '';
            const controller = clientOptions?.urlSuffix ? `/${clientOptions.urlSuffix.replace(/^\/|\/$/g, '')}` : '';
            const path = endpoint ? `/${endpoint.replace(/^\//, '')}` : '';
            const url = `${baseUrl}${controller}${path}`;

            const headers = new Headers(config.requestOptions?.headers);
            
            // Auto-inject JSON content type if sending a body
            if (body && !headers.has('Content-Type')) {
                headers.set('Content-Type', 'application/json');
            }

            let fetchOptions: RequestInit = {
                method,
                ...config.requestOptions,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            };

            // 1. Run Request Interceptor (if defined)
            if (config.requestInterceptor) {
                fetchOptions = await config.requestInterceptor(url, fetchOptions);
            }

            // 2. Execute Request
            let response = await fetch(url, fetchOptions);

            // 3. Run Response Interceptor (if defined)
            if (config.responseInterceptor) {
                response = await config.responseInterceptor(response);
            }

            // 4. Handle and parse the final response
            return await config.responseHandler(response);
        }

        return {
            get: <TResult = any>(endpoint?: string, options?: RequestOptions) => request<TResult>("GET", endpoint, undefined, options),
            post: <TResult = any>(endpoint?: string, body?: any, options?: RequestOptions) => request<TResult>("POST", endpoint, body, options),
            put: <TResult = any>(endpoint?: string, body?: any, options?: RequestOptions) => request<TResult>("PUT", endpoint, body, options),
            delete: <TResult = any>(endpoint?: string, body?: any, options?: RequestOptions) => request<TResult>("DELETE", endpoint, body, options),
            patch: <TResult = any>(endpoint?: string, body?: any, options?: RequestOptions) => request<TResult>("PATCH", endpoint, body, options)
        };
    }
}

export const HttpClient = {
    configure: configureHttpClient
}