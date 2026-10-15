import { ServiceType } from "./ServiceType";
import { ServiceLifetime } from "./ServiceLifetime";
import { KeyedServiceFactory, ServiceFactory } from "./ServiceFactory";
import { ServiceKey } from "./ServiceKey";

/**
 * Represents the configuration and registration blueprint of a service within the container.
 * 
 * @template T The service contract type.
 */
export type ServiceDescriptor<T> = {
    /** The token uniquely identifying the service type. */
    type: ServiceType<T>;
    /** Optional discriminator key for keyed services, or null for non-keyed default services. */
    key: ServiceKey | null;
    /** Cached instance for singletons, or null if uninstantiated / non-singleton. */
    instance: T | null;
    /** Lifetime policy governing instantiation and caching. */
    lifetime: ServiceLifetime;
    /** Factory responsible for creating instances of the service. */
    factory: ServiceFactory<T> | KeyedServiceFactory<T>;
};

export namespace ServiceDescriptor {

    /**
     * Creates a service descriptor with an explicit lifetime and factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param lifetime The service lifetime ('singleton', 'scoped', or 'transient').
     * @param factory The factory function to construct the service.
     * @returns A configured `ServiceDescriptor`.
     */
    export function create<TService>(
        type: ServiceType<TService>,
        lifetime: ServiceLifetime,
        factory: ServiceFactory<TService>,
    ): ServiceDescriptor<TService> {
        return {
            type: type,
            key: null,
            lifetime: lifetime,
            factory: factory,
            instance: null,
        };
    }

    /**
     * Creates a singleton service descriptor with a pre-constructed instance.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param instance The singleton service instance.
     * @returns A singleton `ServiceDescriptor`.
     */
    export function singleton<TService>(
        type: ServiceType<TService>,
        instance: TService,
    ): ServiceDescriptor<TService>;

    /**
     * Creates a singleton service descriptor with a factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param factory The factory function to construct the singleton.
     * @returns A singleton `ServiceDescriptor`.
     */
    export function singleton<TService>(
        type: ServiceType<TService>,
        factory: ServiceFactory<TService>,
    ): ServiceDescriptor<TService>;

    export function singleton<TService>(
        type: ServiceType<TService>,
        instanceOrFactory: TService | ServiceFactory<TService>,
    ): ServiceDescriptor<TService> {
        const [factory, instance] = typeof instanceOrFactory === "function"
            ? [instanceOrFactory, null]
            : [() => instanceOrFactory, instanceOrFactory];
        return {
            type: type,
            key: null,
            lifetime: "singleton",
            factory: factory as ServiceFactory<TService>,
            instance: instance,
        };
    }

    /**
     * Creates a scoped service descriptor with a factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param factory The factory function to construct the scoped service.
     * @returns A scoped `ServiceDescriptor`.
     */
    export function scoped<TService>(
        type: ServiceType<TService>,
        factory: ServiceFactory<TService>,
    ): ServiceDescriptor<TService> {
        return {
            type: type,
            key: null,
            lifetime: "scoped",
            factory: factory,
            instance: null,
        };
    }

    /**
     * Creates a transient service descriptor with a factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param factory The factory function to construct the transient service.
     * @returns A transient `ServiceDescriptor`.
     */
    export function transient<TService>(
        type: ServiceType<TService>,
        factory: ServiceFactory<TService>,
    ): ServiceDescriptor<TService> {
        return {
            type: type,
            key: null,
            lifetime: "transient",
            factory: factory,
            instance: null,
        };
    }

    /**
     * Creates a keyed service descriptor with an explicit lifetime and keyed factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param key The discriminator key identifying this implementation.
     * @param lifetime The service lifetime ('singleton', 'scoped', or 'transient').
     * @param factory The factory function to construct the keyed service.
     * @returns A keyed `ServiceDescriptor`.
     */
    export function createKeyed<TService>(
        type: ServiceType<TService>,
        key: ServiceKey,
        lifetime: ServiceLifetime,
        factory: KeyedServiceFactory<TService>,
    ): ServiceDescriptor<TService> {
        return {
            type: type,
            key: key,
            lifetime: lifetime,
            factory: factory,
            instance: null,
        };
    }

    /**
     * Creates a keyed singleton service descriptor with a pre-constructed instance.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param key The discriminator key identifying this implementation.
     * @param instance The singleton service instance.
     * @returns A keyed singleton `ServiceDescriptor`.
     */
    export function keyedSingleton<TService>(
        type: ServiceType<TService>,
        key: ServiceKey,
        instance: TService,
    ): ServiceDescriptor<TService>;

    /**
     * Creates a keyed singleton service descriptor with a keyed factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param key The discriminator key identifying this implementation.
     * @param factory The factory function to construct the keyed singleton.
     * @returns A keyed singleton `ServiceDescriptor`.
     */
    export function keyedSingleton<TService>(
        type: ServiceType<TService>,
        key: ServiceKey,
        factory: KeyedServiceFactory<TService>,
    ): ServiceDescriptor<TService>;

    export function keyedSingleton<TService>(
        type: ServiceType<TService>,
        key: ServiceKey,
        instanceOrFactory: TService | KeyedServiceFactory<TService>,
    ): ServiceDescriptor<TService> {
        const [factory, instance] = typeof instanceOrFactory === "function"
            ? [instanceOrFactory, null]
            : [() => instanceOrFactory, instanceOrFactory];
        return {
            type: type,
            key: key,
            lifetime: "singleton",
            factory: factory as KeyedServiceFactory<TService>,
            instance: instance,
        };
    }

    /**
     * Creates a keyed scoped service descriptor with a keyed factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param key The discriminator key identifying this implementation.
     * @param factory The factory function to construct the keyed scoped service.
     * @returns A keyed scoped `ServiceDescriptor`.
     */
    export function keyedScoped<TService>(
        type: ServiceType<TService>,
        key: ServiceKey,
        factory: KeyedServiceFactory<TService>,
    ): ServiceDescriptor<TService> {
        return {
            type: type,
            key: key,
            lifetime: "scoped",
            factory: factory,
            instance: null,
        };
    }

    /**
     * Creates a keyed transient service descriptor with a keyed factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param key The discriminator key identifying this implementation.
     * @param factory The factory function to construct the keyed transient service.
     * @returns A keyed transient `ServiceDescriptor`.
     */
    export function keyedTransient<TService>(
        type: ServiceType<TService>,
        key: ServiceKey,
        factory: KeyedServiceFactory<TService>,
    ): ServiceDescriptor<TService> {
        return {
            type: type,
            key: key,
            lifetime: "transient",
            factory: factory,
            instance: null,
        };
    }
}