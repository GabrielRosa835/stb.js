import { ServiceScope } from "./ServiceScope";
import { ServiceType } from "./ServiceType";

/**
 * Factory service responsible for spawning new lifetime scopes.
 * Typically resolved via `ServiceType.ServiceScopeFactory`.
 */
export type ServiceScopeFactory = {
    /**
     * Creates a new `ServiceScope`.
     * Scoped services resolved through the returned scope's provider are isolated to this scope.
     *
     * @returns A fresh `ServiceScope` instance.
     */
    createScope: () => ServiceScope;
};

export namespace ServiceScopeFactory {
    /**
     * Built-in token representing the `ServiceScopeFactory`.
     */
    export const Type = ServiceType.of<ServiceScopeFactory>(Symbol("ServiceScopeFactory"), { 
        name: "ServiceScopeFactory", 
        description: "Factory used to create new ServiceScopes", 
        module: "DependencyInjection" 
    });
}
