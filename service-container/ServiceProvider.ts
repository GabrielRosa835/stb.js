import { AsyncDisposable } from "../common/AsyncDisposable";
import { Disposable } from "../common/Disposable";
import { ServiceDescriptor } from "./ServiceDescriptor";
import { KeyedServiceFactory, ServiceFactory } from "./ServiceFactory";
import { ServiceKey } from "./ServiceKey";
import { ServiceScope } from "./ServiceScope";
import { ServiceScopeFactory } from "./ServiceScopeFactory";
import { ServiceType } from "./ServiceType";

/**
 * The core service resolution interface responsible for locating and instantiating dependencies.
 */
export type ServiceProvider = {

    /**
     * Resolves all registered implementations of a given service type.
     * Returns an empty array if no implementations are registered.
     *
     * @template T The service contract type.
     * @param type The service type token.
     * @returns An array containing all resolved service instances in order of registration.
     */
    getAll<T>(type: ServiceType<T>): T[];

    /**
     * Attempts to resolve a keyed service.
     *
     * @template T The service contract type.
     * @param type The service type token.
     * @param key The discriminator key.
     * @returns The resolved service instance, or `null` if not registered.
     */
    findKeyed<T>(type: ServiceType<T>, key: ServiceKey): T | null;

    /**
     * Resolves a required keyed service. Throws if not registered.
     *
     * @template T The service contract type.
     * @param type The service type token.
     * @param key The discriminator key.
     * @returns The resolved service instance.
     * @throws {Error} If the keyed service is not registered.
     */
    getKeyed<T>(type: ServiceType<T>, key: ServiceKey): T;

    /**
     * Returns a `KeyedServiceProvider` view where all resolutions default to using the specified key.
     *
     * @param key The discriminator key to bind to the view.
     * @returns A keyed service provider view.
     */
    withKey(key: ServiceKey): KeyedServiceProvider;

    /**
     * Attempts to resolve a service. Returns `null` if not registered.
     *
     * @template T The service contract type.
     * @param type The service type token.
     * @returns The resolved service instance, or `null`.
     */
    find<T>(type: ServiceType<T>): T | null;

    /**
     * Attempts to resolve 2 services simultaneously as a positional tuple.
     *
     * @returns A tuple of resolved instances, where missing services are `null`.
     */
    find<T1, T2>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>)
        : [T1 | null, T2 | null];

    /** Attempts to resolve 3 services simultaneously as a positional tuple. */
    find<T1, T2, T3>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>)
        : [T1 | null, T2 | null, T3 | null];

    /** Attempts to resolve 4 services simultaneously as a positional tuple. */
    find<T1, T2, T3, T4>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>,
        type4: ServiceType<T4>)
        : [T1 | null, T2 | null, T3 | null, T4 | null];

    /** Attempts to resolve 5 services simultaneously as a positional tuple. */
    find<T1, T2, T3, T4, T5>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>,
        type4: ServiceType<T4>,
        type5: ServiceType<T5>)
        : [T1 | null, T2 | null, T3 | null, T4 | null, T5 | null];

    /** Attempts to resolve 6 services simultaneously as a positional tuple. */
    find<T1, T2, T3, T4, T5, T6>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>,
        type4: ServiceType<T4>,
        type5: ServiceType<T5>,
        type6: ServiceType<T6>)
        : [T1 | null, T2 | null, T3 | null, T4 | null, T5 | null, T6 | null];

    /** Attempts to resolve 7 services simultaneously as a positional tuple. */
    find<T1, T2, T3, T4, T5, T6, T7>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>,
        type4: ServiceType<T4>,
        type5: ServiceType<T5>,
        type6: ServiceType<T6>,
        type7: ServiceType<T7>)
        : [T1 | null, T2 | null, T3 | null, T4 | null, T5 | null, T6 | null, T7 | null];

    /** Attempts to resolve 8 services simultaneously as a positional tuple. */
    find<T1, T2, T3, T4, T5, T6, T7, T8>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>,
        type4: ServiceType<T4>,
        type5: ServiceType<T5>,
        type6: ServiceType<T6>,
        type7: ServiceType<T7>,
        type8: ServiceType<T8>)
        : [T1 | null, T2 | null, T3 | null, T4 | null, T5 | null, T6 | null, T7 | null, T8 | null];

    /** Attempts to resolve 9 services simultaneously as a positional tuple. */
    find<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>,
        type4: ServiceType<T4>,
        type5: ServiceType<T5>,
        type6: ServiceType<T6>,
        type7: ServiceType<T7>,
        type8: ServiceType<T8>,
        type9: ServiceType<T9>)
        : [T1 | null, T2 | null, T3 | null, T4 | null, T5 | null, T6 | null, T7 | null, T8 | null, T9 | null];
    
    /**
     * Resolves a required service. Throws if not registered.
     *
     * @template T The service contract type.
     * @param type The service type token.
     * @returns The resolved service instance.
     * @throws {Error} If the service is not registered.
     */
    get<T>(type: ServiceType<T>): T;

    /**
     * Resolves 2 required services simultaneously as a positional tuple.
     *
     * @returns A strongly-typed tuple containing both resolved services.
     * @throws {Error} If any of the services are not registered.
     */
    get<T1, T2>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>)
        : [T1, T2];

    /** Resolves 3 required services simultaneously as a positional tuple. */
    get<T1, T2, T3>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>)
        : [T1, T2, T3];

    /** Resolves 4 required services simultaneously as a positional tuple. */
    get<T1, T2, T3, T4>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>,
        type4: ServiceType<T4>)
        : [T1, T2, T3, T4];

    /** Resolves 5 required services simultaneously as a positional tuple. */
    get<T1, T2, T3, T4, T5>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>,
        type4: ServiceType<T4>,
        type5: ServiceType<T5>)
        : [T1, T2, T3, T4, T5];

    /** Resolves 6 required services simultaneously as a positional tuple. */
    get<T1, T2, T3, T4, T5, T6>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>,
        type4: ServiceType<T4>,
        type5: ServiceType<T5>,
        type6: ServiceType<T6>)
        : [T1, T2, T3, T4, T5, T6];

    /** Resolves 7 required services simultaneously as a positional tuple. */
    get<T1, T2, T3, T4, T5, T6, T7>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>,
        type4: ServiceType<T4>,
        type5: ServiceType<T5>,
        type6: ServiceType<T6>,
        type7: ServiceType<T7>)
        : [T1, T2, T3, T4, T5, T6, T7];

    /** Resolves 8 required services simultaneously as a positional tuple. */
    get<T1, T2, T3, T4, T5, T6, T7, T8>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>,
        type4: ServiceType<T4>,
        type5: ServiceType<T5>,
        type6: ServiceType<T6>,
        type7: ServiceType<T7>,
        type8: ServiceType<T8>)
        : [T1, T2, T3, T4, T5, T6, T7, T8];

    /** Resolves 9 required services simultaneously as a positional tuple. */
    get<T1, T2, T3, T4, T5, T6, T7, T8, T9>(
        type1: ServiceType<T1>,
        type2: ServiceType<T2>,
        type3: ServiceType<T3>,
        type4: ServiceType<T4>,
        type5: ServiceType<T5>,
        type6: ServiceType<T6>,
        type7: ServiceType<T7>,
        type8: ServiceType<T8>,
        type9: ServiceType<T9>)
        : [T1, T2, T3, T4, T5, T6, T7, T8, T9];
};

/**
 * A `ServiceProvider` view bound to a specific `ServiceKey`.
 * Calls to `find` and `get` resolve implementations registered with this key.
 */
export type KeyedServiceProvider = {

    /** Resolves all registered implementations matching this key. */
    getAll<T>(type: ServiceType<T>): T[];

    /** Attempts to resolve a service with the bound key. Returns `null` if not found. */
    find<T>(type: ServiceType<T>): T | null;
    find<T1, T2>(type1: ServiceType<T1>, type2: ServiceType<T2>): [T1 | null, T2 | null];
    find<T1, T2, T3>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>): [T1 | null, T2 | null, T3 | null];
    find<T1, T2, T3, T4>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>, type4: ServiceType<T4>): [T1 | null, T2 | null, T3 | null, T4 | null];
    find<T1, T2, T3, T4, T5>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>, type4: ServiceType<T4>, type5: ServiceType<T5>): [T1 | null, T2 | null, T3 | null, T4 | null, T5 | null];
    find<T1, T2, T3, T4, T5, T6>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>, type4: ServiceType<T4>, type5: ServiceType<T5>, type6: ServiceType<T6>): [T1 | null, T2 | null, T3 | null, T4 | null, T5 | null, T6 | null];
    find<T1, T2, T3, T4, T5, T6, T7>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>, type4: ServiceType<T4>, type5: ServiceType<T5>, type6: ServiceType<T6>, type7: ServiceType<T7>): [T1 | null, T2 | null, T3 | null, T4 | null, T5 | null, T6 | null, T7 | null];
    find<T1, T2, T3, T4, T5, T6, T7, T8>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>, type4: ServiceType<T4>, type5: ServiceType<T5>, type6: ServiceType<T6>, type7: ServiceType<T7>, type8: ServiceType<T8>): [T1 | null, T2 | null, T3 | null, T4 | null, T5 | null, T6 | null, T7 | null, T8 | null];
    find<T1, T2, T3, T4, T5, T6, T7, T8, T9>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>, type4: ServiceType<T4>, type5: ServiceType<T5>, type6: ServiceType<T6>, type7: ServiceType<T7>, type8: ServiceType<T8>, type9: ServiceType<T9>): [T1 | null, T2 | null, T3 | null, T4 | null, T5 | null, T6 | null, T7 | null, T8 | null, T9 | null];
    
    /** Resolves a required service with the bound key. Throws if not found. */
    get<T>(type: ServiceType<T>): T;
    get<T1, T2>(type1: ServiceType<T1>, type2: ServiceType<T2>): [T1, T2];
    get<T1, T2, T3>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>): [T1, T2, T3];
    get<T1, T2, T3, T4>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>, type4: ServiceType<T4>): [T1, T2, T3, T4];
    get<T1, T2, T3, T4, T5>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>, type4: ServiceType<T4>, type5: ServiceType<T5>): [T1, T2, T3, T4, T5];
    get<T1, T2, T3, T4, T5, T6>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>, type4: ServiceType<T4>, type5: ServiceType<T5>, type6: ServiceType<T6>): [T1, T2, T3, T4, T5, T6];
    get<T1, T2, T3, T4, T5, T6, T7>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>, type4: ServiceType<T4>, type5: ServiceType<T5>, type6: ServiceType<T6>, type7: ServiceType<T7>): [T1, T2, T3, T4, T5, T6, T7];
    get<T1, T2, T3, T4, T5, T6, T7, T8>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>, type4: ServiceType<T4>, type5: ServiceType<T5>, type6: ServiceType<T6>, type7: ServiceType<T7>, type8: ServiceType<T8>): [T1, T2, T3, T4, T5, T6, T7, T8];
    get<T1, T2, T3, T4, T5, T6, T7, T8, T9>(type1: ServiceType<T1>, type2: ServiceType<T2>, type3: ServiceType<T3>, type4: ServiceType<T4>, type5: ServiceType<T5>, type6: ServiceType<T6>, type7: ServiceType<T7>, type8: ServiceType<T8>, type9: ServiceType<T9>): [T1, T2, T3, T4, T5, T6, T7, T8, T9];
};

function formatService(type: ServiceType<any>, key?: ServiceKey | null): string {
    const meta = ServiceType.metadata(type);
    const name = meta?.name ?? type.description ?? "UnknownService";
    const mod = meta?.module ? ` in [${meta.module}]` : "";
    const keyStr = key ? ` (keyed: '${key}')` : "";
    return `'${name}'${keyStr}${mod}`;
}

function createProvider(descriptors: ServiceDescriptor<unknown>[]): ServiceProvider {

    function createScope(isRoot: boolean): ServiceScope {

        const _descriptors = descriptors;
        const _resolutionStack = new Set<string>();
        const _scopedCache = new Map<ServiceDescriptor<unknown>, unknown>();
        const _scopedInstances: unknown[] = [];

        let scopeInstance: ServiceScope;

        const _serviceScopeFactoryInstance: ServiceScopeFactory = {
            createScope: () => createScope(false),
        };

        function findDescriptor<T>(typeId: symbol, key?: ServiceKey | null): ServiceDescriptor<T> | null {
            if (key !== undefined && key !== null) {
                for (let i = _descriptors.length - 1; i >= 0; i--) {
                    const d = _descriptors[i];
                    if (d.type === typeId && d.key === key) {
                        return d as ServiceDescriptor<T>;
                    }
                }
                return null;
            }

            let fallbackKeyed: ServiceDescriptor<T> | null = null;
            for (let i = _descriptors.length - 1; i >= 0; i--) {
                const d = _descriptors[i];
                if (d.type === typeId) {
                    if (d.key === null) {
                        return d as ServiceDescriptor<T>;
                    }
                    if (fallbackKeyed === null) {
                        fallbackKeyed = d as ServiceDescriptor<T>;
                    }
                }
            }

            return fallbackKeyed;
        }

        function findAllDescriptors<T>(typeId: symbol, key?: ServiceKey | null): ServiceDescriptor<T>[] {
            const matches: ServiceDescriptor<T>[] = [];
            for (let i = 0; i < _descriptors.length; i++) {
                const d = _descriptors[i];
                if (key !== undefined && key !== null) {
                    if (d.type === typeId && d.key === key) {
                        matches.push(d as ServiceDescriptor<T>);
                    }
                } else {
                    if (d.type === typeId) {
                        matches.push(d as ServiceDescriptor<T>);
                    }
                }
            }
            return matches;
        }

        function instantiateDescriptor<T>(descriptor: ServiceDescriptor<T>, currentProvider: ServiceProvider): T {
            const resolutionKey = descriptor.key !== null 
                ? `${String(descriptor.type)}#${descriptor.key}` 
                : String(descriptor.type);

            if (_resolutionStack.has(resolutionKey)) {
                const chain = Array.from(_resolutionStack).join(' -> ');
                throw new Error(`Circular dependency detected: ${chain} -> ${resolutionKey}`);
            }

            function instantiate(trackInScoped: boolean): T {
                _resolutionStack.add(resolutionKey);

                let created: T;
                if (descriptor.key === null) {
                    created = (descriptor.factory as ServiceFactory<T>)(currentProvider);
                } else {
                    created = (descriptor.factory as KeyedServiceFactory<T>)(currentProvider, descriptor.key);
                }

                _resolutionStack.delete(resolutionKey);

                if (trackInScoped) {
                    _scopedInstances.push(created);
                }

                return created;
            }

            if (descriptor.lifetime === "singleton") {
                if (descriptor.instance !== null) return descriptor.instance;
                descriptor.instance = instantiate(false);
                return descriptor.instance;
            }

            if (descriptor.lifetime === "scoped") {
                if (isRoot) {
                    throw new Error(`Cannot resolve scoped service ${formatService(descriptor.type, descriptor.key)} from the root ServiceProvider.`);
                }
                if (_scopedCache.has(descriptor as any)) {
                    return _scopedCache.get(descriptor as any) as T;
                }
                const created = instantiate(true);
                _scopedCache.set(descriptor as any, created);
                return created;
            }

            return instantiate(false);
        }

        function getService<T>(typeId: symbol, currentProvider: ServiceProvider, key?: ServiceKey | null): T | null {
            if (typeId === ServiceScopeFactory.Type) {
                return _serviceScopeFactoryInstance as unknown as T;
            }
            if (typeId === ServiceScope.Type) {
                return isRoot ? null : (scopeInstance as unknown as T);
            }
            if (typeId === ServiceProvider.Type) {
                return currentProvider as unknown as T;
            }

            const descriptor = findDescriptor<T>(typeId, key);
            if (!descriptor) return null;

            return instantiateDescriptor(descriptor, currentProvider);
        }

        function getAllServices<T>(typeId: symbol, currentProvider: ServiceProvider, key?: ServiceKey | null): T[] {
            const matchedDescriptors = findAllDescriptors<T>(typeId, key);
            return matchedDescriptors.map(d => instantiateDescriptor(d, currentProvider));
        }

        function createProviderView(fixedKey: ServiceKey | null): ServiceProvider {

            const view: ServiceProvider = {

                find: ((...types: ServiceType<any>[]): any => {
                    if (types.length === 1) {
                        return getService(types[0], view, fixedKey);
                    }
                    return types.map(t => getService(t, view, fixedKey));
                }) as any,

                findKeyed: <T>(type: ServiceType<T>, key: ServiceKey): T | null => {
                    return getService<T>(type, view, key);
                },

                get: ((...types: ServiceType<any>[]): any => {
                    const resolveSingle = (t: ServiceType<any>, key: ServiceKey | null) => {
                        const service = getService(t, view, key);
                        if (!service) {
                            throw new Error(`Service ${formatService(t, key)} not registered.`);
                        }
                        return service;
                    };

                    if (types.length === 1) {
                        return resolveSingle(types[0], fixedKey);
                    }
                    return types.map(t => resolveSingle(t, fixedKey));
                }) as any,

                getKeyed: <T>(type: ServiceType<T>, key: ServiceKey): T => {
                    const service = getService<T>(type, view, key);
                    if (!service) {
                        throw new Error(`Service ${formatService(type, key)} not registered.`);
                    }
                    return service;
                },

                getAll: <T>(type: ServiceType<T>): T[] => {
                    return getAllServices(type, view, fixedKey);
                },

                withKey: (key: ServiceKey): KeyedServiceProvider => {
                    return createProviderView(key);
                },
            };

            return view;
        }

        const provider = createProviderView(null);

        const dispose = () => {
            for (let i = _scopedInstances.length - 1; i >= 0; i--) {
                const instance = _scopedInstances[i] as Partial<Disposable>;
                if (typeof instance?.dispose === 'function') {
                    instance.dispose();
                }
            }
        };

        const disposeAsync = async () => {
            for (let i = _scopedInstances.length - 1; i >= 0; i--) {
                const instance = _scopedInstances[i] as Partial<AsyncDisposable & Disposable>;
                if (typeof instance?.disposeAsync === 'function') {
                    await instance.disposeAsync();
                } else if (typeof instance?.dispose === 'function') {
                    instance.dispose();
                }
            }
        };

        scopeInstance = { provider, dispose, disposeAsync };
        return scopeInstance;
    }

    return createScope(true).provider;
}

export namespace ServiceProvider {
    /**
     * Compiles an array of service descriptors into a root `ServiceProvider`.
     *
     * @param descriptors The configured service descriptors.
     * @returns The root `ServiceProvider` instance.
     */
    export const create = createProvider;

    /**
     * Built-in token representing the active `ServiceProvider`.
     */
    export const Type = ServiceType.of<ServiceProvider>(Symbol("ServiceProvider"), { 
        name: "ServiceProvider", 
        description: "The active dependency injection container", 
        module: "DependencyInjection" 
    });
};