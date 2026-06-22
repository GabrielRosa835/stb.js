export type Entry<K extends string = string, V = unknown> = {
  [P in K]: Record<P, V> & {
    [Q in Exclude<K, P>]?: never;
  };
}[K];

export const Entry = {
    getKey: function <K extends string, V>(entry: Entry<K, V>): K {
        return Object.keys(entry)[0] as K;
    }
};

export type ResourceManagerConfigurationOptions<
    TSchema,
    TNamespaces extends string,
    TDefault extends TNamespaces,
    TFallback extends TNamespaces,
> = {
    default: Entry<TDefault, TSchema>;
    fallback?: Entry<TFallback, Partial<TSchema>>;
    others?: Record<Exclude<TNamespaces, TDefault | TFallback>, Partial<TSchema>>;
    onNamespaceChange?: (namespace: TNamespaces) => void;
}

export type ResourceManagerOptions<TNamespaces extends string> = {
    onNamespaceChange?: (namespace: TNamespaces) => void;
}

/**
 * The Consumer API
 * Note the use of `readonly` for the getter property, and the generic 
 * TNamespaces union which eliminates magic strings.
 */
export type ResourceManager<TSchema, TNamespaces extends string> = {
    get: <TKey extends keyof TSchema>(key: TKey) => TSchema[TKey];
    readonly currentNamespace: TNamespaces;
    setNamespace: (namespace: TNamespaces) => void;
};

export namespace Infer {
    /**
     * Extracts the union of all valid namespaces from a configured resource manager.
     */
    export type Namespaces<T> = T extends ResourceManagerConfigurationOptions<
        any, infer TNamespaces, any, any> ? TNamespaces : never;

    /**
     * Extracts the strict schema definition from the configuration.
     */
    export type Schema<T> = T extends ResourceManagerConfigurationOptions<
        infer TSchema, any, any, any> ? TSchema : never;

    export type Default<T> = T extends ResourceManagerConfigurationOptions<
        any, any, infer TDefault, any> ? TDefault : never;

    export type Fallback<T> = T extends ResourceManagerConfigurationOptions<
        any, any, any, infer TFallback> ? TFallback : never;
};

function configureResourceManager<
    TSchema,
    TNamespaces extends string,
    TDefault extends TNamespaces,
    TFallback extends TNamespaces,
>(configurationOptions: ResourceManagerConfigurationOptions<TSchema, TNamespaces, TDefault, TFallback>) {
    
    let currentNamespace: TNamespaces = Entry.getKey(configurationOptions.default);
    type OtherNamespaces = Exclude<TNamespaces, TDefault | TFallback>;

    /**
     * The Consuming Layer (Parameterless Factory)
     */
    return function useResourceManager(contextOptions?: ResourceManagerOptions<TNamespaces>): ResourceManager<TSchema, TNamespaces> {
        return {
            get: <TKey extends keyof TSchema>(key: TKey): TSchema[TKey] => {

                const currentValue = configurationOptions.others 
                    ? configurationOptions.others[currentNamespace as OtherNamespaces][key] 
                    : undefined;
                if (currentValue !== undefined) {
                    return currentValue;
                }

                const fallbackValue = configurationOptions.fallback 
                    ? configurationOptions.fallback[Entry.getKey(configurationOptions.fallback)][key] 
                    : undefined;
                if (fallbackValue !== undefined) {
                    return fallbackValue;
                }

                return configurationOptions.default[Entry.getKey(configurationOptions.default)]![key];
            },
            
            setNamespace: (namespace: TNamespaces) => {
                if (currentNamespace === namespace) {
                    return;
                }
                currentNamespace = namespace;
                contextOptions?.onNamespaceChange?.(namespace);
                configurationOptions.onNamespaceChange?.(namespace);
            },
            
            // Implementing the getter
            get currentNamespace() {
                return currentNamespace;
            },
        };

    };
}

export const ResourceManager = {
    configure: configureResourceManager,
}

/**
 * The Configuration Builder
 * 1. Takes TSchema explicitly.
 * 2. Returns a function that infers the string literal keys from the object.
 */
function defineSchema<TSchema>() {
    return function inferNamespaces<
        TDefault extends string,
        TFallback extends string = never,
        TOthers extends string = never
    >(config: {
        default: Entry<TDefault, TSchema>;
        fallback?: Entry<TFallback, Partial<TSchema>>;
        others?: Record<TOthers, Partial<TSchema>>;
    }): ResourceManagerConfigurationOptions<TSchema, TDefault | TFallback | TOthers, TDefault, TFallback> {
        return config as any; 
    }
}

function defineResources<
    TSchema,
    TDefault extends string,
    TFallback extends string = never,
    TOthers extends string = never
>(config: {
    default: Entry<TDefault, TSchema>;
    fallback?: Entry<TFallback, Partial<TSchema>>;
    others?: Record<TOthers, Partial<TSchema>>;
}): ResourceManagerConfigurationOptions<TSchema, TDefault | TFallback | TOthers, TDefault, TFallback> {
    return config as any; 
}

export type Resources = never;

export const Resources = {
    define: defineResources,
    defineSchema,
}