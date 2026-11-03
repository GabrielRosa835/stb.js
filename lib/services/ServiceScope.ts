import { AsyncDisposable } from "../common/AsyncDisposable";
import { Disposable } from "../common/Disposable";
import { ServiceProvider } from "./ServiceProvider";
import { ServiceType } from "./ServiceType";

/**
 * Represents an isolated lifetime boundary for scoped services.
 * 
 * Implements both synchronous `Disposable` and asynchronous `AsyncDisposable` contracts.
 * Disposing the scope tears down all instantiated scoped services in reverse resolution order.
 */
export type ServiceScope = Disposable & AsyncDisposable & {
    /**
     * The scoped `ServiceProvider` instance whose resolutions are isolated to this scope.
     */
    readonly provider: ServiceProvider;
};

export namespace ServiceScope {
    /**
     * Built-in token representing the active `ServiceScope`.
     * Resolves to `null` if queried directly from the root container.
     */
    export const Type = ServiceType.of<ServiceScope>(Symbol("ServiceScope"), { 
        name: "ServiceScope", 
        description: "Current lifetime scope for scoped dependencies", 
        module: "DependencyInjection" 
    });
}
