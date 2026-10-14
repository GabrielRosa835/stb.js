/**
 * Defines the lifecycle policy governing how a service is created, cached, and shared within the DI container.
 * 
 * - `'singleton'`: Instantiated once per root container. Shared globally across all scopes and singletons.
 * - `'scoped'`: Instantiated once per `ServiceScope`. Shared locally within the active scope, and invalid to resolve from the root container.
 * - `'transient'`: Instantiated upon every resolution request. Never cached.
 */
export type ServiceLifetime = 'singleton' | 'transient' | 'scoped';
