import { ServiceKey } from "./ServiceKey";
import { ServiceProvider } from "./ServiceProvider";

/**
 * Factory function responsible for instantiating a non-keyed service.
 *
 * @template T The service interface or class type being produced.
 * @param sp The active `ServiceProvider` instance used to resolve dependencies.
 * @returns The instantiated service instance.
 */
export type ServiceFactory<T> = (sp: ServiceProvider) => T;

/**
 * Factory function responsible for instantiating a keyed service.
 *
 * @template T The service interface or class type being produced.
 * @param sp The active `ServiceProvider` instance used to resolve dependencies.
 * @param key The discriminator key passed during resolution or registration.
 * @returns The instantiated service instance.
 */
export type KeyedServiceFactory<T> = (sp: ServiceProvider, key: ServiceKey) => T;