/**
 * A branded symbol uniquely representing a service contract, preserving compile-time type information.
 *
 * @template T The expected type of the resolved service.
 */
export type ServiceType<T> = symbol & { readonly __type: T };

export namespace ServiceType {
    
    const _metadata: Map<ServiceType<unknown>, Metadata> = new Map();

    /**
     * Configuration options when declaring a `ServiceType` token.
     */
    export type Options = {
        /** Human-readable display name for diagnostics and logging. */
        name?: string;
        /** Detailed description of the service's purpose. */
        description?: string;
        /** Architectural module or package that defines this service. */
        module?: string;
    };
    
    /**
     * Immutable metadata associated with a `ServiceType` token.
     */
    export type Metadata = {
        readonly typeId: symbol;
        readonly name?: string;
        readonly description?: string;
        readonly module?: string;
    };

    /**
     * Creates a strongly-typed `ServiceType` token branded to `TService` and registers its metadata.
     *
     * @template TService The contract type resolved by this token.
     * @param id Unique symbol identifying this service.
     * @param options Optional metadata (name, description, module, etc.).
     * @returns The branded `ServiceType<TService>` token.
     */
    export function of<TService>(id: symbol, options?: Options): ServiceType<TService> {
        const type = id as ServiceType<TService>;
        _metadata.set(type, {
            typeId: id,
            name: options?.name,
            description: options?.description,
            module: options?.module,
        });
        return type;
    }

    /**
     * Retrieves the metadata attached to a `ServiceType` token.
     *
     * @template TService The service contract type.
     * @param type The `ServiceType` token to query.
     * @returns The associated `Metadata` object, or `null` if unconfigured.
     */
    export function metadata<TService>(type: ServiceType<TService>): Metadata | null {
        return _metadata.get(type) ?? null;
    }

    /**
     * Returns a readonly map containing all registered `ServiceType` tokens and their metadata.
     *
     * @returns Readonly map of tokens to metadata.
     */
    export function getAllMetadata(): ReadonlyMap<ServiceType<unknown>, Metadata> {
        return _metadata;
    }
}