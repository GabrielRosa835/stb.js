import { ServiceDescriptor } from "./ServiceDescriptor";
import { ServiceFactory, KeyedServiceFactory } from "./ServiceFactory";
import { ServiceKey } from "./ServiceKey";
import { ServiceLifetime } from "./ServiceLifetime";
import { ServiceProvider } from "./ServiceProvider";
import { ServiceType } from "./ServiceType";

/**
 * Fluent builder used to configure and register service descriptors before compiling a `ServiceProvider`.
 */
export type ServiceCollection = {

    /** The list of registered service descriptors configured so far. */
    descriptors: ServiceDescriptor<unknown>[];

    /**
     * Compiles the collection of service descriptors into a root `ServiceProvider`.
     *
     * @returns A new root `ServiceProvider`.
     */
    build: () => ServiceProvider;

    /**
     * Appends an existing `ServiceDescriptor` to the collection.
     *
     * @template TService The service contract type.
     * @param descriptor The descriptor to register.
     * @returns The collection builder instance for chaining.
     */
    add<TService>(descriptor: ServiceDescriptor<TService>): ServiceCollection;

    /**
     * Registers a service with an explicit lifetime policy and factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param lifetime The lifetime policy ('singleton', 'scoped', or 'transient').
     * @param factory The factory function to construct the service.
     * @returns The collection builder instance for chaining.
     */
    add<TService>(type: ServiceType<TService>, lifetime: ServiceLifetime, factory: ServiceFactory<TService>): ServiceCollection;

    /**
     * Registers a singleton service with a pre-constructed instance.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param instance The singleton instance.
     * @returns The collection builder instance for chaining.
     */
    addSingleton<TService>(type: ServiceType<TService>, instance: TService): ServiceCollection;

    /**
     * Registers a singleton service with a factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param factory The factory function to construct the singleton.
     * @returns The collection builder instance for chaining.
     */
    addSingleton<TService>(type: ServiceType<TService>, factory: ServiceFactory<TService>): ServiceCollection;

    /**
     * Registers a scoped service with a factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param factory The factory function to construct the scoped service.
     * @returns The collection builder instance for chaining.
     */
    addScoped<TService>(type: ServiceType<TService>, factory: ServiceFactory<TService>): ServiceCollection;

    /**
     * Registers a transient service with a factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param factory The factory function to construct the transient service.
     * @returns The collection builder instance for chaining.
     */
    addTransient<TService>(type: ServiceType<TService>, factory: ServiceFactory<TService>): ServiceCollection;

    /**
     * Registers a keyed service with an explicit lifetime policy and keyed factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param key The discriminator key identifying this implementation.
     * @param lifetime The lifetime policy ('singleton', 'scoped', or 'transient').
     * @param factory The factory function to construct the keyed service.
     * @returns The collection builder instance for chaining.
     */
    addKeyed<TService>(type: ServiceType<TService>, key: ServiceKey, lifetime: ServiceLifetime, factory: KeyedServiceFactory<TService>): ServiceCollection;

    /**
     * Registers a keyed singleton service with a pre-constructed instance.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param key The discriminator key identifying this implementation.
     * @param instance The singleton instance.
     * @returns The collection builder instance for chaining.
     */
    addKeyedSingleton<TService>(type: ServiceType<TService>, key: ServiceKey, instance: TService): ServiceCollection;

    /**
     * Registers a keyed singleton service with a keyed factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param key The discriminator key identifying this implementation.
     * @param factory The factory function to construct the keyed singleton.
     * @returns The collection builder instance for chaining.
     */
    addKeyedSingleton<TService>(type: ServiceType<TService>, key: ServiceKey, factory: KeyedServiceFactory<TService>): ServiceCollection;

    /**
     * Registers a keyed scoped service with a keyed factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param key The discriminator key identifying this implementation.
     * @param factory The factory function to construct the keyed scoped service.
     * @returns The collection builder instance for chaining.
     */
    addKeyedScoped<TService>(type: ServiceType<TService>, key: ServiceKey, factory: KeyedServiceFactory<TService>): ServiceCollection;

    /**
     * Registers a keyed transient service with a keyed factory function.
     *
     * @template TService The service contract type.
     * @param type The service type token.
     * @param key The discriminator key identifying this implementation.
     * @param factory The factory function to construct the keyed transient service.
     * @returns The collection builder instance for chaining.
     */
    addKeyedTransient<TService>(type: ServiceType<TService>, key: ServiceKey, factory: KeyedServiceFactory<TService>): ServiceCollection;
};

function createCollection(): ServiceCollection {

    const _descriptors: ServiceDescriptor<unknown>[] = [];

    function addInternal(descriptorOrType: any, lifetime: any, factory: any) {
        if (typeof descriptorOrType === "symbol") {
            _descriptors.push(ServiceDescriptor.create(descriptorOrType as ServiceType<unknown>, lifetime, factory));
        }
        else {
            _descriptors.push(descriptorOrType);
        }
        return builder;
    };

    const builder: ServiceCollection = {
        descriptors: _descriptors,

        add: addInternal as any,

        addSingleton(type, instanceOrFactory) {
            _descriptors.push(ServiceDescriptor.singleton(type, instanceOrFactory));
            return this;
        },

        addScoped(type, factory) {
            _descriptors.push(ServiceDescriptor.scoped(type, factory));
            return this;
        },

        addTransient(type, factory) {
            _descriptors.push(ServiceDescriptor.transient(type, factory));
            return this;
        },

        addKeyed(type, key, lifetime, factory) {
            _descriptors.push(ServiceDescriptor.createKeyed(type, key, lifetime, factory));
            return this;
        },

        addKeyedSingleton(type, key, instanceOrFactory) {
            _descriptors.push(ServiceDescriptor.keyedSingleton(type, key, instanceOrFactory));
            return this;
        },

        addKeyedScoped(type, key, factory) {
            _descriptors.push(ServiceDescriptor.keyedScoped(type, key, factory));
            return this;
        },

        addKeyedTransient(type, key, factory) {
            _descriptors.push(ServiceDescriptor.keyedTransient(type, key, factory));
            return this;
        },

        build: () => ServiceProvider.create(_descriptors),
    };

    return builder as ServiceCollection;
}

export namespace ServiceCollection {
    /**
     * Creates a new, empty `ServiceCollection` to begin configuring service registrations.
     *
     * @returns An empty `ServiceCollection` instance.
     */
    export const create = createCollection;
}