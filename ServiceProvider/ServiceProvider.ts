/**
 * Defines the lifecycle policy of a service within the DI container.
 * - `singleton`: Instantiated once per container definition (shared globally across all scopes).
 * - `scoped`: Instantiated once per `ServiceProvider` instance (shared locally within a scope).
 * - `transient`: Instantiated every time it is resolved (never cached).
 */
export type ServiceLifetime = 'singleton' | 'transient' | 'scoped';

/**
 * A branded string type representing a unique key for a service, retaining its underlying type definition.
 * @template T The expected type of the resolved service.
 */
export type ServiceKey<T> = string & { __type: T };

export type ServicesDefinition = Record<ServiceKey<unknown>, unknown>;

/**
 * Describes how a service should be created and managed by the container.
 * * @template T The type of the service.
 */
export type ServiceDescriptor<T, TDefinition extends ServicesDefinition> = {
    /** The lifecycle rule governing the service's caching behavior. */
    lifetime: ServiceLifetime;
    /** The factory function responsible for instantiating the service. */
    factory: (sp: ServiceProvider<TDefinition>) => T;
};

/**
 * A registry mapping service names (keys) to their corresponding descriptors.
 * * @template TDefinition A record defining the contract of all available services.
 */
export type ServiceRegistry<TDefinition extends ServicesDefinition> = {
    [K in keyof TDefinition]: ServiceDescriptor<TDefinition[K], TDefinition>;
};

/**
 * The core container interface responsible for resolving registered services.
 */
export type ServiceProvider<TDefinition extends ServicesDefinition> = TDefinition & {
    /**
     * Resolves a service by its key. Throws an error if the service is not found.
     * @template T The expected return type of the service.
     * @param {ServiceKey<T> | string} key The key identifying the service.
     * @returns {T} The resolved service instance.
     * @throws {Error} If the service is not registered or if a circular dependency is detected.
     */
    resolve: <T>(key: ServiceKey<T> | string) => T;

    /**
     * Attempts to resolve a service by its key. Returns null if not found.
     * @template T The expected return type of the service.
     * @param {ServiceKey<T> | string} key The key identifying the service.
     * @returns {T | null} The resolved service instance, or null if unregistered.
     * @throws {Error} If a circular dependency is detected during resolution.
     */
    locate: <T>(key: ServiceKey<T> | string) => T | null;
}


/**
 * A fluent builder interface for configuring a ServiceProvider, inspired by .NET's IServiceCollection.
 * 
 * It incrementally builds the service map type (TMap) as services are registered, ensuring strict type safety.
 * 
 * **NOTE:** Due to the way the Map type accumulates Records, you may only retrieve services in factories that have already been 
 * registered. Not only that but the ending type may be quite clutered if you have lots of anonymous (untyped) services. 
 * Use the manually defined TMap approach if you prefer something cleaner or unordered registration support.
 * @template TMap The accumulated record of services registered so far.
 */
export type ServiceCollection<TMap extends Record<ServiceKey<unknown>, unknown> = {}> = {
    /**
     * Registers a service with a 'singleton' lifetime.
     * @param key The string identifier for the service.
     * @param factory The factory function. The injected provider knows about all previously registered services.
     */
    addSingleton<K extends string, T>(
        key: K, 
        factory: (sp: ServiceProvider<TMap>) => T
    ): ServiceCollection<TMap>;
    
    /**
     * Registers a service with a 'scoped' lifetime.
     * @param key The string identifier for the service.
     * @param factory The factory function.
     */
    addScoped<K extends string, T>(
        key: K, 
        factory: (sp: ServiceProvider<TMap>) => T
    ): ServiceCollection<TMap>;

    /**
     * Registers a service with a 'transient' lifetime.
     * @param key The string identifier for the service.
     * @param factory The factory function.
     */
    addTransient<K extends string, T>(
        key: K, 
        factory: (sp: ServiceProvider<TMap>) => T
    ): ServiceCollection<TMap>;

    /**
     * Compiles the registered services into a functional container factory.
     * @returns A factory function that generates containers (`MapServiceProvider`).
     */
    buildSpecification(): () => ServiceProvider<TMap>;
}

/**
 * Defines and configures a new functional Service Container.
 * This function utilizes closures to maintain a global singleton cache shared across all created scopes.
 * @template TDefinition A record defining the available services and their types.
 * @param {ServiceRegistry<TDefinition>} services The registry of configured service descriptors.
 * @returns {() => MapServiceProvider<TDefinition>} A factory function. Invoking this function creates a new `ServiceProvider` instance (a new scope).
 */
function configureServiceContainer<TDefinition extends ServicesDefinition>(
    services: ServiceRegistry<TDefinition>
): () => ServiceProvider<TDefinition> {

    // Global to ALL providers
    const singletonCache = {} as Record<string, unknown>;

    // Calling this creates a new Scope
    return function createProvider(): ServiceProvider<TDefinition> {
        const resolutionStack = new Set<string>(); 
        
        // Local to THIS specific provider
        const scopedCache = {} as Record<string, unknown>; 
        
        const provider: ServiceProvider<TDefinition> = {
            locate: <T>(key: ServiceKey<T> | string): T | null => {
                const typedKey = key as string;
                const descriptor = services[typedKey as keyof TDefinition];
                
                if (!descriptor) return null;

                if (resolutionStack.has(typedKey)) {
                    throw new Error(`Circular dependency detected: ${Array.from(resolutionStack).join(' -> ')} -> ${typedKey}`);
                }

                const instantiate = () => {
                    resolutionStack.add(typedKey);
                    const created = descriptor.factory(proxyProvider); 
                    resolutionStack.delete(typedKey);
                    return created as T;
                };

                // 1. SINGLETON: Check the global cache
                if (descriptor.lifetime === "singleton") {
                    if (singletonCache[typedKey]) {
                        return singletonCache[typedKey] as T;
                    }
                    
                    const created = instantiate();
                    singletonCache[typedKey] = created;
                    return created;
                }

                // 2. SCOPED: Check the local cache
                if (descriptor.lifetime === "scoped") {
                    if (scopedCache[typedKey]) {
                        return scopedCache[typedKey] as T;
                    }
                    
                    const created = instantiate();
                    scopedCache[typedKey] = created;
                    return created as T;
                }

                return instantiate();
            },

            resolve: <T>(key: ServiceKey<T> | string): T => {
                const service = provider.locate<T>(key);
                if (!service) throw new Error(`Service '${key as string}' not registered.`);
                return service;
            },
            
        } as ServiceProvider<TDefinition>;

        const proxyProvider = new Proxy(provider as ServiceProvider<TDefinition>, {
            get(target, prop, receiver) {
                if (prop === 'resolve' || prop === 'locate') {
                    return Reflect.get(target, prop, receiver);
                }
                if (typeof prop === 'symbol') {
                    return Reflect.get(target, prop, receiver);
                }
                if (prop === 'then') {
                    return undefined; // Prevent issues with Promise-like behavior
                }
                return target.resolve(prop);
            }
        });

        return proxyProvider;
    }
}

/**
 * Creates a new, empty ServiceCollection to begin fluent registration.
 */
function createServiceCollection<TDefinition extends ServicesDefinition>(): ServiceCollection<TDefinition> {
    
    const registry = {} as ServiceRegistry<TDefinition>;

    const builder: ServiceCollection<TDefinition> = {
        addSingleton(key, factory) {
            registry[key as unknown as keyof TDefinition] = { lifetime: 'singleton', factory } as ServiceDescriptor<any, TDefinition>;
            return this;
        },
        addScoped(key, factory) {
            registry[key as unknown as keyof TDefinition] = { lifetime: 'scoped', factory } as ServiceDescriptor<any, TDefinition>;
            return this;
        },
        addTransient(key, factory) {
            registry[key as unknown as keyof TDefinition] = { lifetime: 'transient', factory } as ServiceDescriptor<any, TDefinition>;
            return this;
        },
        buildSpecification: () => configureServiceContainer(registry),
    };

    return builder;
}

export const ServiceProvider = {
    specify: configureServiceContainer,
}

export const ServiceCollection = {
    create: createServiceCollection,
}