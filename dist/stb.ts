export type EqualityComparer<T> = (left: T, right: T) => boolean;



/**
 * Tipos básicos aceitos como retorno válido em um processo de serialização JSON.
 */
export type Serializable = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: Serializable } 
  | Serializable[];



export function exists<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}

export function empty<T extends string | unknown[]>(array: T | string | undefined): array is T {
  if (typeof array === "string") return array === "";
  return exists(array) && array.length === 0;
}

export function unused(args?: any): any { }

export function log<T>(args: T, prefix?: string): T {
  if (prefix) console.log(prefix, args);
  else console.log(args);
  return args;
}

export function assert<T>(condition: boolean | ((args?: T) => boolean), message?: string | Error): T | any {
  let result;
  if (typeof condition === "function") {
    result = condition();
  } else {
    result = condition;
  }
  if (!result) {
    let error;
    if (typeof message === "string") {
      error = new Error(message ?? "Assertion failed");
    }
    else if (typeof message === "undefined") {
      error = new Error("Assertion failed");
    }
    else /* type === Error */ {
      error = message;
    }
    console.log(error);
    throw error;
  }
  return;
}

export const utilities = { exists, empty, unused, log, assert };

export default utilities;

/**
 * Para adicionar componentes globais no projeto cliente, 
 * basta importar diretamente este arquivo.
 * Recomenda-se realizar a importação diretamente em main.tsx,
 * para propagar as declarações globais por todo o projeto.
 * ```
 * import "@fazsoftsolutions/fazsoft-react-lib-test/global.d.ts";
 * ```
 */
declare global {
  /**
   * Tipo utilitário para indicar algo que não será utilizado.
   */
  type Unused = any;

  /**
   * Verifica se o valor não é nulo nem indefinido, ignorando outros valores "falsy" (como 0 ou false).
   */
  function exists<T>(value: T | null | undefined): value is T;

  /**
   * Verifica se um array ou string existe e está vazio.
   */
  function empty<T extends string | unknown[]>(array: T | string | undefined): array is T;

  /**
   * Preenche restrições do TypeScript em locais onde um argumento é exigido, mas sabe-se que não será utilizado.
   */
  function unused(args?: any): any;
  /**
   * Imprime os dados no console e retorna o próprio valor, permitindo seu uso contínuo dentro de expressões.
   */
  function log<T>(args: T, prefix?: string): T;

  /**
   * Lança um erro se a condição não for atendida (falsa).
   */
  function assert<T>(statement: boolean | ((args?: T) => boolean), message?: string | Error): T | any;
}

if (typeof globalThis !== "undefined") {
  globalThis.exists = utilities.exists;
  globalThis.empty = utilities.empty;
  globalThis.unused = utilities.unused;
  globalThis.log = utilities.log;
  globalThis.assert = utilities.assert;
}

export { };



export type Validation<T> = (entry: T, context?: Validation.Context) => Validation.Result;

export namespace Validation {

    export type ErrorLike = string | ErrorDefinition | Error;

    export type ErrorDefinition = {
        message: string;
        property?: string;
        code?: string;
        attempted?: any;
        state?: any;
        severity?: Severity;
    }

    export type Error = {
        /** The error message */
        message: string;
        /** The name of the property */
        property?: string;
        /** The property value that caused the failure */
        attempted?: unknown;
        /** Custom state associated with the failure */
        state?: unknown;
        /** Custom severity level associated with the failure */
        severity: Severity;
        /** The code that uniquely identifies the error type */
        code?: string;
    }

    export type Result = {
        errors: Error[];
        isValid: boolean;
    }

    export type Severity = "error" | "warning" | "info";

    export type MessageFormatter = (error: Error) => string | void;
    export type ErrorInterceptor = (error: Error) => Error | void;
    export type ResultInterceptor = (error: Result) => Result | void;

    export type Unsubscriber = () => void;

    /**
     * The pipeline should always be 'message formatter' -> 'error interceptor' -> 'result interceptor'
     */
    export type Context = {
        /** User defined state to allow identifying and managing multiple contexts */
        readonly state: unknown;

        readonly addFormatter: (formatter: MessageFormatter) => Unsubscriber;
        readonly addErrorInterceptor: (interceptor: ErrorInterceptor) => Unsubscriber;
        readonly addResultInterceptor: (interceptor: ResultInterceptor) => Unsubscriber;

        readonly messageFor: (error: Error) => string;
        readonly errorFor: (error: Error) => Error;
        readonly resultFor: (error: Result) => Result;

        readonly failure: (error: ErrorLike | ErrorLike[], ...errors: ErrorLike[]) => Result;
        readonly success: () => Result;
        readonly error: (def: ErrorDefinition | string) => Error
    }
}

const createContext = (state: unknown): Validation.Context => {

    const _formatters: Set<Validation.MessageFormatter> = new Set();
    const _errorInterceptors: Set<Validation.ErrorInterceptor> = new Set();
    const _resultInterceptors: Set<Validation.ResultInterceptor> = new Set();

    function addFormatter(formatter: Validation.MessageFormatter): Validation.Unsubscriber {
        _formatters.add(formatter);
        return () => _formatters.delete(formatter);
    }
    function addErrorInterceptor(interceptor: Validation.ErrorInterceptor): Validation.Unsubscriber {
        _errorInterceptors.add(interceptor);
        return () => _errorInterceptors.delete(interceptor);
    }
    function addResultInterceptor(interceptor: Validation.ResultInterceptor): Validation.Unsubscriber {
        _resultInterceptors.add(interceptor);
        return () => _resultInterceptors.delete(interceptor);
    }

    function messageFor(error: Validation.Error): string {
        for (const formatter of _formatters) {
            const msg = formatter(error);
            if (msg !== undefined) {
                return msg;
            }
        }
        return error.message;
    }
    function errorFor(error: Validation.Error): Validation.Error {
        for (const interceptor of _errorInterceptors) {
            const intercepted = interceptor(error);
            if (intercepted !== undefined) {
                return intercepted;
            }
        }
        return error;
    }
    function resultFor(result: Validation.Result): Validation.Result {
        for (const interceptor of _resultInterceptors) {
            const intercepted = interceptor(result);
            if (intercepted !== undefined) {
                return intercepted;
            }
        }
        return result;
    }

    function createFailure(error: Validation.ErrorLike | Validation.ErrorLike[], ...errors: Validation.ErrorLike[]): Validation.Result {

        const outErrors: Validation.ErrorLike[] = [];

        if (!Array.isArray(error)) {
            outErrors.push(error);
        }
        else {
            // TODO: Verify this constraint
            if (error.length === 0) {
                throw new Error("Cannot create a failed validation result without errors");
            }
            outErrors.push(...error);
        }

        outErrors.push(...errors);

        return {
            isValid: false,
            errors: outErrors.map(createError),
        };
    }

    function createSuccess(): Validation.Result {
        return resultFor({ errors: [], isValid: true });
    };

    function createError(def: Validation.ErrorLike): Validation.Error {
        const base: Validation.Error = {
            message: "",
            severity: "error",
        };
        if (typeof def === 'string') {
            base.message = def;
        }
        else {
            base.message = def.message;
            base.property = def.property;
            base.attempted = def.attempted;
            base.state = def.state;
            base.code = def.code;
            base.severity = def.severity ?? base.severity;
        }
        base.message = messageFor(base);
        return errorFor(base);
    };

    return {

        state,

        addFormatter,
        addErrorInterceptor,
        addResultInterceptor,

        messageFor,
        errorFor,
        resultFor,

        failure: createFailure,
        success: createSuccess,
        error: createError,

    };
}

type GlobalValidationContext = Validation.Context & {
    createContext: (state: unknown) => Validation.Context;
};

/** 
 * A global `Validation.Context`.
 * Used as fallback when no other is specified at the Validation<T> level.
 * Exposes a `createContext` method to create custom ones with a unique state as identifier.
 */
export const Validation: GlobalValidationContext = {
    ...createContext(undefined),
    createContext,
} as const;





export const first = <T>(...validations: Validation<T>[]): Validation<T> => (entry, entryContext) => {

    const ctx = entryContext ?? Validation;

    if (entry === null || entry === undefined) {
        return ctx.success();
    }

    for (const validate of validations) {
        const result = validate(entry, ctx);
        if (!result.isValid) {
            return ctx.failure(result.errors[0]);
        }
    }

    return ctx.success();
};





const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
export const EMAIL_VALIDATION_ERROR_CODE = "VALIDATION_EMAIL";

export function email(): Validation<string> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        if (EMAIL_REGEX.test(entry)) {
            return ctx.success();
        }

        return ctx.failure({
            message: "", // TODO: Create a default message
            attempted: entry,
            code: EMAIL_VALIDATION_ERROR_CODE,
        });
    };
}





type ErrorPredicate = (value: Validation.Error, index?: number, array?: Validation.Error[]) => boolean;

export function filter<T>(predicate: ErrorPredicate, ...validators: Validation<T>[]): Validation<T> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        const errors: Validation.Error[] = [];

        for (const validate of validators) {
            const result = validate(entry, ctx);
            if (!result.isValid) {
                const filteredErrors = result.errors.filter(predicate);
                errors.push(...filteredErrors);
            }
        }

        if (errors.length > 0) {
            return ctx.failure(errors);
        }
        return ctx.success();
    };
}





const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
const IPV6_REGEX = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:)((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;

export const IP_ADDRESS_VALIDATION_ERROR_CODE = "VALIDATION_IP_ADDRESS"

export function ipAddress(): Validation<string> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        if (IPV4_REGEX.test(entry) || IPV6_REGEX.test(entry)) {
            return ctx.success();
        }

        return ctx.failure({
            message: "", // TODO: default message
            attempted: entry,
            code: IP_ADDRESS_VALIDATION_ERROR_CODE,
        });
    };
}





export function all<T>(...validators: Validation<T>[]): Validation<T> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        const errors: Validation.Error[] = [];

        for (const validate of validators) {
            const result = validate(entry, ctx);
            if (!result.isValid) {
                errors.push(...result.errors);
            }
        }

        if (errors.length > 0) {
            return ctx.failure(errors);
        }
        return ctx.success();
    };
}






export const ONE_OF_VALIDATION_ERROR_CODE = "VALIDATION_ONE_OF";

export function oneOf<T>(allowedValues: T[], comparer?: EqualityComparer<T>): Validation<T> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        if (comparer && allowedValues.some(t => comparer(entry, t))) {
            return ctx.success();
        }
        if (allowedValues.includes(entry)) {
            return ctx.success();
        }

        const defaultMsg = `O valor deve ser um dos seguintes: ${allowedValues.join(", ")}.`;

        return ctx.failure({
            message: defaultMsg,
            attempted: entry,
            code: ONE_OF_VALIDATION_ERROR_CODE,
        });
    };
}





type InRangeDefinition = {
    min?: number,
    max?: number,
}

export const IN_RANGE_VALIDATION_ERROR_CODE = "VALIDATION_IN_RANGE";

export function inRange({ min, max }: InRangeDefinition): Validation<number> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined || Number.isNaN(entry)) {
            return ctx.success();
        }

        const tooSmall = min !== undefined && entry < min;
        const tooLarge = max !== undefined && entry > max;

        if (!tooSmall && !tooLarge) {
            return ctx.success();
        }

        let defaultMsg = "Valor fora do limite permitido.";
        if (min !== undefined && max !== undefined) {
            defaultMsg = `O valor deve estar entre ${min} e ${max}.`;
        } else if (min !== undefined) {
            defaultMsg = `O valor deve ser no mínimo ${min}.`;
        } else if (max !== undefined) {
            defaultMsg = `O valor deve ser no máximo ${max}.`;
        }

        return ctx.failure({
            message: defaultMsg, // TODO: default message
            attempted: entry,
            code: IN_RANGE_VALIDATION_ERROR_CODE,
        });
    };
}





export function select<T, V>(
    accessor: (entry: T) => V, 
    validator: Validation<V>,
    /** Optional pathing as the 'property' identifier */
    pathName?: string
): Validation<T> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        const selectedValue = accessor(entry);
        const result = validator(selectedValue, ctx);

        if (result.isValid) {
            return result;
        }

        // Map errors using the provided pathName
        const errors = result.errors.map(err => ({
            ...err,
            property: pathName ? err.property ? `${pathName}.${err.property}` : pathName : undefined,
            attempted: err.attempted !== undefined ? err.attempted : selectedValue,
        }));

        return ctx.failure(errors);
    };
}





export const REQUIRED_VALIDATION_ERROR_CODE = "VALIDATION_REQUIRED";

export const required = <T>(): Validation<T> => (entry, entryContext) => {

    const ctx = entryContext ?? Validation;

    if (entry !== null && entry !== undefined) {
        return ctx.success();
    }
    
    return ctx.failure({
        message: "", // TODO: default message
        attempted: entry,
        code: REQUIRED_VALIDATION_ERROR_CODE,
    });
};





type LengthDefinition = {
    min?: number,
    max?: number,
}

export const LENGTH_VALIDATION_ERROR_CODE = "VALIDATION_LENGTH";

export function length<T extends string | unknown[]>({ min, max }: LengthDefinition): Validation<T> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        const len = entry.length;
        const tooShort = min !== undefined && len < min;
        const tooLong = max !== undefined && len > max;

        if (!tooShort && !tooLong) {
            return ctx.success();
        }

        // Construct a sensible default message based on provided arguments
        let defaultMsg = "Tamanho inválido.";
        if (min !== undefined && max !== undefined) {
            defaultMsg = `O tamanho deve estar entre ${min} e ${max}.`;
        } else if (min !== undefined) {
            defaultMsg = `O tamanho mínimo é ${min}.`;
        } else if (max !== undefined) {
            defaultMsg = `O tamanho máximo é ${max}.`;
        }

        return ctx.failure({
            message: defaultMsg,
            attempted: entry,
            code: LENGTH_VALIDATION_ERROR_CODE,
        });
    };
}





export const NOT_EMTPY_VALIDATION_ERROR_CODE = "VALIDATION_NOT_EMPTY";

export function notEmpty<T extends string | unknown[]>(): Validation<T> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        let isEmpty = false;

        if (typeof entry === "string") {
            isEmpty = entry.trim() === "";
        } else if (Array.isArray(entry)) {
            isEmpty = entry.length === 0;
        }

        if (!isEmpty) {
            return ctx.success();
        }

        return ctx.failure({
            message: "", // TODO: default message
            attempted: entry,
            code: NOT_EMTPY_VALIDATION_ERROR_CODE,
        });
    };
}






export const NONE_OF_VALIDATION_ERROR_CODE = "VALIDATION_NONE_OF";

export function noneOf<T>(forbiddenValues: T[], comparer?: EqualityComparer<T>): Validation<T> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        if (comparer && !forbiddenValues.some(t => comparer(entry, t))) {
            return ctx.success();
        }
        if (!forbiddenValues.includes(entry)) {
            return ctx.success();
        }

        const defaultMsg = `O valor não pode ser um dos seguintes: ${forbiddenValues.join(", ")}.`;

        return ctx.failure({
            message: defaultMsg,
            attempted: entry,
            code: NONE_OF_VALIDATION_ERROR_CODE,
        });
    };
}





export function field<T extends object, K extends keyof T>(field: K, validator: Validation<T[K]>): Validation<T> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        const propertyValue = entry[field];
        const result = validator(propertyValue, ctx);

        if (result.isValid) {
            return result;
        }

        // Map errors to build the path chain (e.g., "parent.child.grandchild")
        const mappedErrors = result.errors.map(err => ({
            ...err,
            property: err.property ? `${String(field)}.${err.property}` : String(field),
            attempted: err.attempted !== undefined ? err.attempted : propertyValue,
        }));

        return ctx.failure(mappedErrors);
    };
}





export function forEach<T>(validator: Validation<T>): Validation<T[]> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined || !Array.isArray(entry)) {
            return ctx.success();
        }

        const errors: Validation.ErrorLike[] = [];

        entry.forEach((item, index) => {
            const result = validator(item);

            if (!result.isValid) {

                // Map the errors to inject the array index into the property path
                const mappedErrors = result.errors.map(err => ({
                    ...err,
                    property: err.property ? `[${index}].${err.property}` : `[${index}]`,
                    attempted: err.attempted !== undefined ? err.attempted : item,
                }));

                errors.push(...mappedErrors);
            }
        });

        if (errors.length > 0) {
            return ctx.failure(errors);
        }
        return ctx.success();
    };
}





type ValidatorComplement = {
    readonly CODE: string;
}

function withCode<T extends Function>(
    validator: T, 
    code: string
): T & ValidatorComplement {
    return Object.defineProperty(validator, 'CODE', {
        value: code,
        writable: false,
        enumerable: true
    }) as T & ValidatorComplement;
}

export type Validate = never;

export const Validate = {
    email: withCode(email, EMAIL_VALIDATION_ERROR_CODE),
    inRange: withCode(inRange, IN_RANGE_VALIDATION_ERROR_CODE),
    ipAddress: withCode(ipAddress, IP_ADDRESS_VALIDATION_ERROR_CODE),
    length: withCode(length, LENGTH_VALIDATION_ERROR_CODE),
    noneOf: withCode(noneOf, NONE_OF_VALIDATION_ERROR_CODE),
    notEmpty: withCode(notEmpty, NOT_EMTPY_VALIDATION_ERROR_CODE),
    oneOf: withCode(oneOf, ONE_OF_VALIDATION_ERROR_CODE),
    required: withCode(required, REQUIRED_VALIDATION_ERROR_CODE),

    all,
    filter,
    first,
    forEach,
    field,
    select,
} as const;



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
    addSingleton<K extends keyof TMap, T>(
        key: K, 
        factory: (sp: ServiceProvider<TMap>) => T
    ): ServiceCollection<TMap>;
    
    /**
     * Registers a service with a 'scoped' lifetime.
     * @param key The string identifier for the service.
     * @param factory The factory function.
     */
    addScoped<K extends keyof TMap, T>(
        key: K, 
        factory: (sp: ServiceProvider<TMap>) => T
    ): ServiceCollection<TMap>;

    /**
     * Registers a service with a 'transient' lifetime.
     * @param key The string identifier for the service.
     * @param factory The factory function.
     */
    addTransient<K extends keyof TMap, T>(
        key: K, 
        factory: (sp: ServiceProvider<TMap>) => T
    ): ServiceCollection<TMap>;

    /**
     * Compiles the registered services into a functional container factory.
     * @returns A factory function that generates containers (`MapServiceProvider`).
     */
    build(): () => ServiceProvider<TMap>;
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
        build: () => configureServiceContainer(registry),
    };

    return builder;
}

export const ServiceProvider = {
    configure: configureServiceContainer,
}

export const ServiceCollection = {
    create: createServiceCollection,
}



const HOURS_TO_MILLIS = 3600000;
const MINS_TO_MILLIS = 60000;
const SECS_TO_MILLIS = 1000;

/**
 * Representa um intervalo de tempo ou duração.
 * 
 * **Observação:** Esta classe foi desenhada para transitar de forma 
 * transparente entre o front (React) e o back (ASP.NET Core), interceptando `JSON.stringify()`
 * com uma implementação que já mapeia para uma string no formato de `TimeSpan`.
 */
export class Time {
    /** Armazenamento interno e imutável da duração total em milissegundos. */
    private readonly _totalMilliseconds: number;

    private constructor(milliseconds: number) {
        this._totalMilliseconds = milliseconds;
    }

    /** Obtém o componente de horas do intervalo de tempo (excluindo dias, se houvesse). */
    get hours(): number { return Math.floor(this._totalMilliseconds / HOURS_TO_MILLIS); }
    /** Obtém o valor fracionário total de horas que este intervalo representa. */
    get totalHours(): number { return this._totalMilliseconds * HOURS_TO_MILLIS; }
    

    /** Obtém o componente de minutos do intervalo de tempo (entre 0 e 59). */
    get minutes(): number { return Math.floor((this._totalMilliseconds % HOURS_TO_MILLIS) / MINS_TO_MILLIS); }
    /** Obtém o valor fracionário total de minutos que este intervalo representa. */
    get totalMinutes(): number { return this._totalMilliseconds * MINS_TO_MILLIS; }

    /** Obtém o componente de segundos do intervalo de tempo (entre 0 e 59). */
    get seconds(): number { return Math.floor((this._totalMilliseconds % MINS_TO_MILLIS) / SECS_TO_MILLIS); }
    /** Obtém o valor fracionário total de segundos que este intervalo representa. */
    get totalSeconds(): number { return this._totalMilliseconds * SECS_TO_MILLIS; }

    /** Obtém o componente de milissegundos do intervalo de tempo (entre 0 e 999). */
    get milliseconds(): number { return this._totalMilliseconds % SECS_TO_MILLIS; }
    /** Obtém o total absoluto de milissegundos que este intervalo representa. */
    get totalMilliseconds(): number { return this._totalMilliseconds; }

    /**
     * Retorna uma nova instância de `Time` cujo valor é o resultado da adição da instância especificada a esta instância.
     * @param ts O intervalo de tempo a ser adicionado.
     * @returns Uma nova instância de `Time`.
     */
    add(ts: Time): Time {
        return new Time(this._totalMilliseconds + ts.totalMilliseconds);
    }

    /**
     * Retorna uma nova instância de `Time` que adiciona o número especificado de horas a esta instância.
     * @param value O número de horas a ser adicionado (pode ser negativo).
     * @returns Uma nova instância de `Time`.
     */
    addHours(value: number): Time {
        return new Time(this._totalMilliseconds + (value * HOURS_TO_MILLIS));
    }

    /**
     * Retorna uma nova instância de `Time` que adiciona o número especificado de minutos a esta instância.
     * @param value O número de minutos a ser adicionado (pode ser negativo).
     * @returns Uma nova instância de `Time`.
     */
    addMinutes(value: number): Time {
        return new Time(this._totalMilliseconds + (value * MINS_TO_MILLIS));
    }

    /**
     * Retorna uma nova instância de `Time` que adiciona o número especificado de segundos a esta instância.
     * @param value O número de segundos a ser adicionado (pode ser negativo).
     * @returns Uma nova instância de `Time`.
     */
    addSeconds(value: number): Time {
        return new Time(this._totalMilliseconds + (value * SECS_TO_MILLIS));
    }

    /**
     * Retorna uma nova instância de `Time` que adiciona o número especificado de milissegundos a esta instância.
     * @param value O número de milissegundos a ser adicionado (pode ser negativo).
     * @returns Uma nova instância de `Time`.
     */
    addMilliseconds(value: number): Time {
        return new Time(this._totalMilliseconds + value);
    }

    /**
     * Retorna uma nova instância de `Time` cujo valor é a negação (inversão de sinal) desta instância.
     * **Nota:** utilize este método para realizar subtrações. Ex: `tempo1.add(tempo2.negate())`.
     * @returns Uma nova instância de `Time`.
     */
    negate(): Time {
        return new Time(-this._totalMilliseconds);
    }

    /**
     * Compara esta instância com um objeto `Time` especificado e indica se esta instância é mais curta, 
     * igual ou mais longa que o objeto especificado.
     * @param other O intervalo de tempo a ser comparado.
     * @returns Um número que indica a relação entre as instâncias:
     * - `-1`: Esta instância é menor (mais curta) que `other`.
     * - `0`: As instâncias representam o mesmo intervalo de tempo.
     * - `1`: Esta instância é maior (mais longa) que `other`.
     */
    compareTo(other: Time): number {
        if (this._totalMilliseconds < other.totalMilliseconds) return -1;
        if (this._totalMilliseconds > other.totalMilliseconds) return 1;
        return 0;
    }

    /**
     * Retorna um valor que indica se esta instância é igual a um objeto `Time` especificado.
     * @param other O intervalo de tempo a ser comparado.
     * @returns `true` se os intervalos de tempo forem idênticos; caso contrário, `false`.
     */
    equals(other?: Time): boolean {
        return other !== null && other !== undefined && this._totalMilliseconds === other.totalMilliseconds;
    }

    /** Indica se este intervalo de tempo é exatamente zero. */
    get isZero(): boolean {
        return this._totalMilliseconds === 0;
    }

    /** Indica se este intervalo de tempo representa uma duração negativa. */
    get isNegative(): boolean {
        return this._totalMilliseconds < 0;
    }

    /** Indica se este intervalo de tempo representa uma duração positiva (maior que zero). */
    get isPositive(): boolean {
        return this._totalMilliseconds > 0;
    }

    /**
     * Atribui os valores atuais de tempo a uma instância de `Date`.
     * @param date A data original
     * @returns Uma nova instância de `Date`, com os valores de data iguais ao original e os
     * de tempo copiados da instância atual de `Time`
     */
    merge(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
            this.hours, this.minutes, this.seconds, this.milliseconds);
    }

    /**
     * Cria uma nova instância de `Time` a partir dos componentes de tempo especificados.
     * @param hours Quantidade de horas.
     * @param minutes Quantidade de minutos (padrão: 0).
     * @param seconds Quantidade de segundos (padrão: 0).
     * @param milliseconds Quantidade de milissegundos (padrão: 0).
     * @returns Uma nova instância de `Time`.
     */
    static from(hours: number, minutes: number = 0, seconds: number = 0, milliseconds: number = 0): Time {
        const total = (hours * HOURS_TO_MILLIS) +
            (minutes * MINS_TO_MILLIS) +
            (seconds * SECS_TO_MILLIS) +
            milliseconds;
        return new Time(total);
    }

    /**
     * Copia os valores passados como parâmetro para uma nova instância de `Time`.
     * @param original O intervalo de tempo a ser copiado.
     * @returns Uma nova instância de `Time`.
     */
    static clone(original: Time): Time {
        return new Time(original._totalMilliseconds);
    }

    /**
     * Extrai os valores de Date (horas, minutos, segundos e milisegundos) para uma nova instância de `Time`
     * @param date A data de onde será extraída os valores.
     * @returns Uma nova instância de `Time`
     */
    static of(date: Date): Time {
        return Time.from(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
    }

    /**
     * Faz o parse de uma string de tempo no formato padrão do C# `TimeSpan` e retorna uma instância de `Time`.
     * 
     * Suporta os formatos:
     * - `"hh:mm:ss"` (ex: "01:30:00")
     * - `"hh:mm:ss.fff"` para frações de segundo (ex: "01:30:00.500" representa 500ms).
     * @param timeString A string para formatar.
     * @returns Uma instância de `Time`. Retorna um `Time` de valor 0 se a string for vazia ou inválida.
     */
    static parse(timeString: string): Time {
        if (timeString === undefined || timeString === null || timeString.trim() === "") return new Time(0);

        const parts = timeString.split(':');
        const hours = Number(parts[0]) || 0;
        const minutes = Number(parts[1]) || 0;

        // A parte dos segundos pode conter milissegundos separados por um ponto (ex: "15.500")
        const secondsParts = (parts[2] || "0").split('.');
        const seconds = Number(secondsParts[0]) || 0;

        // ASP.NET trata a casa decimal como fração de um segundo.
        // ex: ".5" = 500ms, ".05" = 50ms.
        let milliseconds = 0;
        if (secondsParts[1]) {
            milliseconds = Math.round(parseFloat(`0.${secondsParts[1]}`) * 1000);
        }

        return Time.from(hours, minutes, seconds, milliseconds);
    }

    /**
     * Gera uma lista momentos incrementais a partir de um tempo início e até um tempo final.
     * @param step Intervalo entre cada momento
     * @param min Valor inicial da lista. É 00:00:00 quando vazio.
     * @param max Valor final da lista. É 23:59:59 quando vazio.
     * @returns Lista de instâncias de `Time`
     */
    static sequence(step: Time, min?: Time, max?: Time): Time[] {
        const start = min ?? Time.from(0, 0);
        const end = max ?? Time.from(23, 59, 59);
        const tempValues: Time[] = [];
        let current: Time = Time.clone(start);
        while (current.compareTo(end) !== 1) {
            tempValues.push(current);
            current = current.add(step);
        }
        return tempValues;
    }

    /**
     * Formata o intervalo de tempo para exibição de acordo com um padrão fornecido.
     * Caso o tempo seja negativo, um sinal de menos (`-`) será prefixado automaticamente.
     * 
     * **Formatos suportados:**
     * - `H`: Horas sem zero à esquerda (ex: "5")
     * - `HH`: Horas com zero à esquerda (ex: "05")
     * - `m`: Minutos sem zero à esquerda (ex: "9")
     * - `mm`: Minutos com zero à esquerda (ex: "09")
     * - `s`: Segundos sem zero à esquerda (ex: "2")
     * - `ss`: Segundos com zero à esquerda (ex: "02")
     * - `f`: Milissegundos com 1 dígito (ex: "5")
     * - `ff`: Milissegundos com 2 dígitos (ex: "05")
     * - `fff`: Milissegundos com 3 dígitos (ex: "050")
     * @param pattern O padrão de formatação (padrão: "HH:mm:ss").
     * @returns A string customizada.
     */
    format(pattern: string = "HH:mm:ss"): string {
        const absHours = Math.abs(this.hours);
        const absMinutes = Math.abs(this.minutes);
        const absSeconds = Math.abs(this.seconds);
        const absMilliseconds = Math.abs(this.milliseconds);

        const pad = (n: number, length: number = 2) => n.toString().padStart(length, '0');

        const result = pattern
            .replace(/HH/g, pad(absHours))
            .replace(/H/g, absHours.toString())
            .replace(/mm/g, pad(absMinutes))
            .replace(/m/g, absMinutes.toString())
            .replace(/ss/g, pad(absSeconds))
            .replace(/s/g, absSeconds.toString())
            .replace(/f/g, absMilliseconds.toString())
            .replace(/ff/g, pad(absMilliseconds, 2))
            .replace(/fff/g, pad(absMilliseconds, 3));

        return this.isNegative ? `-${result}` : result;
    }

    /**
     * Converte o intervalo de tempo para o formato de string suportado nativamente pelo C#.
     * Lida automaticamente com durações negativas, prefixando a string com '-'.
     * @returns Uma string no formato `"[C]hh:mm:ss"`. Se houver milissegundos, adiciona o sufixo fracionário: `"hh:mm:ss.fff"`.
     */
    toString(): string {
        const isNegative = this._totalMilliseconds < 0;
        
        // Usamos Math.abs para garantir que os componentes não fiquem com sinais de menos soltos (ex: -1:-30:00)
        const absHours = Math.abs(this.hours);
        const absMinutes = Math.abs(this.minutes);
        const absSeconds = Math.abs(this.seconds);
        const absMilliseconds = Math.abs(this.milliseconds);

        const pad = (n: number) => n.toString().padStart(2, '0');

        let result = `${isNegative ? '-' : ''}${pad(absHours)}:${pad(absMinutes)}:${pad(absSeconds)}`;

        // ASP.NET espera frações de segundo se existirem milissegundos
        if (absMilliseconds > 0) {
            const msPad = (n: number) => n.toString().padStart(3, '0');
            result += `.${msPad(absMilliseconds)}`;
        }

        return result;
    }

    /**
     * Interceptador nativo do JavaScript para serialização JSON.
     * 
     * Quando `JSON.stringify()` é chamado em um objeto que contém esta classe (ex: num payload de requisição HTTP),
     * este método é invocado automaticamente, garantindo que o back-end (ASP.NET) receba o formato de string exato que ele espera
     * para realizar o binding no `TimeSpan`.
     * @returns A string formatada pela função `toString()`.
     */
    toJSON(): string {
        return this.toString();
    }
}





export type SerializationService = {
    /**
     * Sobrescreve o método padrão de transformação para JSON (`toJSON`), substituindo-o por um `serializer` customizado.
     * @param value A instância do objeto que se deseja modificar (ex: uma instância de `Date`).
     * @param serializer Função que acessa o objeto e retorna uma versão serializável. O acesso deve
     * ser realizado via `this`.
     * @returns A própria instância original do objeto mutada, permitindo o uso imediato da variável.
     */
    setSerializer: <T>(value: T, serializer: ((this: T) => Serializable)) => T;
}

function createService(): SerializationService {

    function setSerializer<T>(value: T, serializer: ((this: T) => Serializable)): T {
        // Intercepta a chamada nativa do motor JavaScript (V8) para JSON.stringify
        (value as any).toJSON = serializer;
        return value;
    }

    return {
        setSerializer
    };
}

export const SerializationService = {
    create: createService,
}





export type Serialize = {
    /**
     * Coleção de utilidades de serialização pré-construídas focadas em manipulação de Datas.
     */
    date: {
        /**
         * Implementação de serialização que contorna a conversão automática do JavaScript 
         * de fusos horários (GMT/Local para UTC) disparada nativamente pelo `JSON.stringify()`.
         * 
         * **Comportamento padrão:** Uma data `18:00:00 -03:00` (GMT-3) é convertida via `toISOString()`, resultando na string `"21:00:00.000Z"`.
         * 
         * **Via interceptador:** A mesma data `18:00:00 -03:00` será serializada estritamente como `"18:00:00"`, 
         * preservando o horário local visualizado pelo usuário e ignorando o fuso horário (sem o sufixo `Z`).
         * 
         * @returns Uma string formatada similar ao padrão ISO 8601, mas configurada como um tempo local "Unspecified".
         */
        useTimeAsISO: (this: Date) => Serializable;
    }
}

function useTimeAsISO (this: Date): Serializable {
    const pad = (n: number, length: number = 2) => n.toString().padStart(length, '0');
    
    const year = this.getFullYear().toString();
    const month = pad(this.getMonth() + 1);
    const day = pad(this.getDate());
    const hours = pad(this.getHours());
    const minutes = pad(this.getMinutes());
    const seconds = pad(this.getSeconds());

    // Aplica o sufixo de milissegundos apenas se for maior que zero (padrão esperado por parsers C#)
    const milliseconds = this.getMilliseconds() > 0 ? `.${pad(this.getMilliseconds(), 3)}` : "";

    // Nota: O retorno omite propositalmente o 'Z' no final!
    const result = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${milliseconds}`;

    return result; 
};

export const Serialize = {
    date: {
        useTimeAsISO,
    }
}



export type ResourceEntry<K extends string = string, V = unknown> = {
  [P in K]: Record<P, V> & {
    [Q in Exclude<K, P>]?: never;
  };
}[K];

export const ResourceEntry = {
    getKey: function <K extends string, V>(entry: ResourceEntry<K, V>): K {
        return Object.keys(entry)[0] as K;
    }
};

export type ResourceManagerConfigurationOptions<
    TSchema,
    TNamespaces extends string,
    TDefault extends TNamespaces,
    TFallback extends TNamespaces,
> = {
    default: ResourceEntry<TDefault, TSchema>;
    fallback?: ResourceEntry<TFallback, Partial<TSchema>>;
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
    
    let currentNamespace: TNamespaces = ResourceEntry.getKey(configurationOptions.default);
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
                    ? configurationOptions.fallback[ResourceEntry.getKey(configurationOptions.fallback)][key] 
                    : undefined;
                if (fallbackValue !== undefined) {
                    return fallbackValue;
                }

                return configurationOptions.default[ResourceEntry.getKey(configurationOptions.default)]![key];
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
        default: ResourceEntry<TDefault, TSchema>;
        fallback?: ResourceEntry<TFallback, Partial<TSchema>>;
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
    default: ResourceEntry<TDefault, TSchema>;
    fallback?: ResourceEntry<TFallback, Partial<TSchema>>;
    others?: Record<TOthers, Partial<TSchema>>;
}): ResourceManagerConfigurationOptions<TSchema, TDefault | TFallback | TOthers, TDefault, TFallback> {
    return config as any; 
}

export type Resources = never;

export const Resources = {
    define: defineResources,
    defineSchema,
}





export type Listener<T> = (data: T) => void;
export type Unsubscribe = () => void;

export type ObserverOptions<T> = {
    /** * If true, acts like a BehaviorSubject. New subscribers will immediately 
     * be called with the last notified value upon subscription.
     */
    emitLastValueOnSubscribe?: boolean;
    
    /** The initial value to emit if `emitLastValueOnSubscribe` is true. */
    initialValue?: T;
    
    /** * If true, the observer will ignore `notify` calls where the new value 
     * is equal to the current value. 
     */
    notifyOnlyIfDistinct?: boolean;
    
    /** * Custom function to determine equality. 
     * Ignored if `distinctUntilChanged` is false or undefined.
     * Defaults to `Object.is` for strict reference equality.
     */
    comparer?: EqualityComparer<T>;
};

export type Observer<T> = {
    /** 
     * Adds a new listener for this `Observer` instance 
     * @returns An unsubscriber function that removes the same listener the instance.
     */
    subscribe: (listener: Listener<T>) => Unsubscribe;
    /** Publishes some message across all listeners currently subscribed */
    notify: (data: T) => void;
    /** Removes all currently subscribed listeners from this `Observer` instance */
    clear: () => void;
    readonly currentValue: T | undefined;
    readonly subscriberCount: number;
};

function createObserver<T>(options?: ObserverOptions<T>): Observer<T> {
    
    const _listeners: Set<Listener<T>> = new Set();
    let _currentValue: T | undefined = options?.initialValue;

    // Default to strict equality if no custom comparer is provided
    const comparer = options?.comparer ?? Object.is;

    const subscribe = (listener: Listener<T>): Unsubscribe => {
        _listeners.add(listener);
        if (options?.emitLastValueOnSubscribe && _currentValue !== undefined) {
            listener(_currentValue);
        }
        return () => _listeners.delete(listener);
    };

    const notify = (data: T): void => {
        // Drops the notification if notifyOnlyIfDistinct is enabled and values are equal
        if (options?.notifyOnlyIfDistinct && comparer(_currentValue as T, data)) {
            return;
        }
        _currentValue = data;
        _listeners.forEach((listener) => listener(data));
    };

    const clear = (): void => _listeners.clear();

    return {
        subscribe,
        notify,
        clear,
        get currentValue() {
            return _currentValue;
        },
        get subscriberCount() {
            return _listeners.size;
        }
    };
}

export const Observer = {
    create: createObserver,
}





/**
 * Tipo utilitário (branded type) que representa uma chave do local-storage.
 * Vincula uma string ao tipo do dado (`S`) que será armazenado, garantindo segurança de tipagem.
 */
export type StorageKey<S extends Serializable> = string & { __type: S };

const defaultLocalStorageKeys = {
    token: "token" as StorageKey<string>,
}

export type DefaultLocalStorageKeys = typeof defaultLocalStorageKeys;

export type LocalStorageOptions<TKeysExtension extends Record<string, StorageKey<Serializable>> = {}> = {
    /** Prefixo adicionado automaticamente a todas as chaves no local-storage. */
    keyPrefix?: string;
    /** Dicionário de chaves adicionais que estendem as chaves padrão do serviço. */
    keyExtensions?: TKeysExtension
}

export type LocalStorageConfigurationOptions<TKeysExtension extends Record<string, StorageKey<Serializable>> = {}> = LocalStorageOptions<TKeysExtension>;
export type LocalStorageServiceOptions<TKeysExtension extends Record<string, StorageKey<Serializable>> = {}> = LocalStorageOptions<TKeysExtension>;

export type LocalStorageService<TKeys extends Record<string, StorageKey<Serializable>>> = {
    get: <S extends Serializable>(key: StorageKey<S> | string) => S | null;
    put: <S extends Serializable>(key: StorageKey<S> | string, value: S) => void;
    remove: (key: StorageKey<Serializable> | string) => void;
    /** Dicionário de chaves disponíveis (combinando as chaves padrão, aplicação e contexto). */
    keys: DefaultLocalStorageKeys & TKeys;
}

// Level 1: Application (Definition)
function configureLocalStorageService<TAppKeys extends Record<string, StorageKey<Serializable>> = {}>(
    configurationOptions?: LocalStorageConfigurationOptions<TAppKeys>
) {
    if (typeof window === "undefined") {
        throw new Error("Cannot use localStorage outside a browser");
    }

    // Level 2: Context (Factory)
    return function createService<TContextKeys extends Record<string, StorageKey<Serializable>> = {}>(
        serviceOptions?: LocalStorageServiceOptions<TContextKeys>
    ): LocalStorageService<TAppKeys & TContextKeys> {

        const keys = {
            ...defaultLocalStorageKeys,
            ...(configurationOptions?.keyExtensions ?? {}),
            ...(serviceOptions?.keyExtensions ?? {})
        } as DefaultLocalStorageKeys & TAppKeys & TContextKeys;

        const options = {
            keyExtensions: keys,
            keyPrefix: serviceOptions?.keyPrefix ?? configurationOptions?.keyPrefix ?? "",
        }

        // Level 3: Execution (Methods)
        const get = <S extends Serializable>(key: StorageKey<S> | string): S | null => {
            try {
                const value = localStorage.getItem(options.keyPrefix + key);
                return value ? JSON.parse(value) : null;
            } catch {
                return null;
            }
        };

        const put = <S extends Serializable>(key: StorageKey<S> | string, value: S): void => {
            localStorage.setItem(options.keyPrefix + key, JSON.stringify(value));
        };
        const remove = (key: StorageKey<Serializable> | string): void => {
            localStorage.removeItem(options.keyPrefix + key);
        };

        return {
            get,
            put,
            remove,
            keys,
        };
    }
}

export const LocalStorageService = {
    configure: configureLocalStorageService,
}



const TIMEOUT_LIMIT = 2147483647 as const;

export type UserIdentity<TClaims extends Record<string, any>> = {
    claims: TClaims;
    token: string;
    expiration?: Date;
};

export type TokenStorage = {
    get: () => string | null;
    put: (token: string) => void;
    clear: () => void;
}

export type IdentityServiceOptions<TClaims extends Record<string, any>> = {
    onUserChange?: (state: UserIdentity<TClaims> | null) => void;
};

export type IdentityServiceConfigurationOptions<TClaims extends Record<string, any>> = {
    onUserChange?: (state: UserIdentity<TClaims> | null) => void;
    onFailedParsing?: (error: any) => void;
    parser?: (token: string) => TClaims;
    hydrator?: (tokenBody: any) => TClaims;
    storage: TokenStorage;
    useStandardJwtExp?: boolean;
}

export type IdentityService<TClaims extends Record<string, any>> = {
    user: UserIdentity<TClaims> | null;
    setToken: (token: string, expiration?: Date) => void;
    clearToken: () => void;
};

// Level 1: Application (Definition)
function configureIdentityService<TClaims extends Record<string, any>>
    (configurationOptions: IdentityServiceConfigurationOptions<TClaims>)
    : (serviceOptions?: IdentityServiceOptions<TClaims>) => IdentityService<TClaims> {
    
    if (!configurationOptions.parser && !configurationOptions.hydrator) {
        throw new Error("At least one of 'parser' or 'hydrator' must be defined");
    }

    let user: UserIdentity<TClaims> | null = null;
    let timeoutId: number | null = null;

    function parseClaims(jwtToken: string | null): TClaims | null {
        if (jwtToken === null) return null;
        
        try {
            if (configurationOptions.parser) {
                return configurationOptions.parser(jwtToken);
            }

            // Base64 padding safety
            let tokenBody = jwtToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
            const pad = tokenBody.length % 4;
            if (pad) tokenBody += "=".repeat(4 - pad);

            const bytes = Uint8Array.from(atob(tokenBody), (m) => m.codePointAt(0)!);
            const jsonString = new TextDecoder().decode(bytes);
            const jsonObj = jsonString ? JSON.parse(jsonString) : jsonString;

            if (configurationOptions.hydrator) {
                return configurationOptions.hydrator(jsonObj);
            }
            throw new Error("Invalid state. Either tokenParser or userHydrator must be defined");
        } catch (error) {
            if (configurationOptions.onFailedParsing) {
                configurationOptions.onFailedParsing(error);
            }
            return null;
        }
    }
    
    // Level 2: Context (Factory)
    return function createService(serviceOptions?: IdentityServiceOptions<TClaims>): IdentityService<TClaims> {

        function internalSetToken (token: string | null, expiration?: Date): void {
            if (token === user?.token) {
                return;
            }
            const claims = parseClaims(token);
            if (!token || !claims) {
                user = null;
                setExpiration(undefined);
                configurationOptions.storage.clear();
            }
            else {
                user = {token, claims};
                let finalExpiration = expiration;
                if (configurationOptions.useStandardJwtExp && !finalExpiration && typeof (claims as any).exp === 'number') {
                    finalExpiration = new Date((claims as any).exp * 1000);
                }
                setExpiration(finalExpiration);
                configurationOptions.storage.put(token);
            }
            if (serviceOptions?.onUserChange) {
                serviceOptions.onUserChange(user);
            }
            if (configurationOptions.onUserChange) {
                configurationOptions.onUserChange(user);
            }
        }
    
        function setExpiration(expiration?: Date) {
    
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            if (!expiration) {
                timeoutId = null;
                return;
            };
    
            const expirationMillis = expiration.getTime();
            const now = Date.now();
    
            if (expirationMillis < now) {
                internalSetToken(null);
                return;
            }
    
            let timeout = expirationMillis - now;
            
            if (timeout > TIMEOUT_LIMIT) {
                timeoutId = setTimeout(() => setExpiration(expiration), TIMEOUT_LIMIT);
                return;
            }
            
            if (user) {
                user.expiration = new Date(now + timeout);
            }
    
            timeoutId = setTimeout(() => internalSetToken(null), timeout);
        }
        return {
            get user(): UserIdentity<TClaims> | null {
                return user;
            },
            setToken: internalSetToken,
            clearToken: () => internalSetToken(null),
        };
    }
}

export const IdentityService = {
    configure: configureIdentityService,
}



// Base type to keep configurations DRY across all 3 levels

/**
 * Base configuration options shared across all three configuration levels
 * (Application, Context, and Request).
 * Options defined at lower (more specific) levels override those defined at higher levels.
 */
export type HttpOptions = {
    /** Hook to intercept and modify the request before it is sent.
     * Useful for injecting dynamic headers like Authentication tokens.
     */
    requestInterceptor?: (url: string, options: RequestInit) => Promise<RequestInit> | RequestInit;
    /** Hook to intercept and modify the raw fetch Response before it is handled.
     * Useful for global error logging or refreshing expired tokens.
     */
    responseInterceptor?: (response: Response) => Promise<Response> | Response;
    /** Custom handler to parse the final response. 
     * Defaults to throwing on non-ok statuses and parsing JSON.
     */
    responseHandler?: (response: Response) => Promise<any>;
    /** Standard fetch RequestInit options (e.g., headers, mode, credentials). */
    init?: RequestInit;
};

/** Options applied at the root Application level. */
export type HttpClientConfigurationOptions = HttpOptions & {
    /** The base URL prepended to all relative endpoint paths. */
    baseUrl: string;
};
/** Options applied at the specific Context level (e.g., a specific domain service). */
export type HttpClientOptions = HttpOptions & {
    /** The URL suffix to be used on top of `baseUrl`. Normally attributed to a Controller */
    urlSuffix?: string;
};
/** Options applied to a single, specific HTTP request. */
export type RequestOptions = HttpOptions;

/**
 * The core HTTP Client interface exposing standard REST methods.
 */
export type HttpClient = {
    /** Sends a GET request to the specified endpoint. */
    get: <TResult = void>(endpoint?: string, options?: RequestOptions) => Promise<TResult>;
    /** Sends a POST request with an optional body. */
    post: <TResult = void>(endpoint?: string, body?: any, options?: RequestOptions) => Promise<TResult>;
    /** Sends a PUT request with an optional body. */
    put: <TResult = void>(endpoint?: string, body?: any, options?: RequestOptions) => Promise<TResult>;
    /** Sends a DELETE request with an optional body. */
    delete: <TResult = void>(endpoint?: string, body?: any, options?: RequestOptions) => Promise<TResult>;
    /** Sends a PATCH request with an optional body. */
    patch: <TResult = void>(endpoint?: string, body?: any, options?: RequestOptions) => Promise<TResult>;
}

/**
 * Level 1: Application (Definition)
 * 
 * **PURPOSE:**
 * This is the highest level of the configuration cascade. It establishes global HTTP 
 * behaviors that should apply uniformly across your entire application. By defining 
 * settings here (such as injecting global Authorization tokens, setting up global 
 * error logging, or defining a primary API base URL), you keep your codebase DRY 
 * and prevent repetitive configuration.
 * 
 * **HOW THE CASCADE WORKS:**
 * Settings provided at this Level 1 act as the ultimate fallback. They are inherited 
 * by every client created through the returned factory. However, any setting defined 
 * here can be cleanly overridden by providing a more specific configuration at Level 2 
 * (Context) or Level 3 (Request).
 * @param configurationOptions - Global fallback configurations (e.g., universal headers, root base URL).
 * @returns A factory function (Level 2) tailored to create context-specific clients.
 */
function configureHttpClient(configurationOptions: HttpClientConfigurationOptions): (contextOptions?: HttpClientOptions) => HttpClient {

    if (configurationOptions.baseUrl || configurationOptions.baseUrl.trim() === "") {
        throw new Error("A baseUrl is required to send requests.");
    }

    async function defaultResponseHandler(response: Response): Promise<any> {
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        // Handle 204 No Content or empty bodies safely
        const text = await response.text();
        return text ? JSON.parse(text) : null;
    }

    // Merge App Level and Context Level (Context wins)
    const mergeOptions = (appConfig: HttpClientConfigurationOptions) => (ctxConfig?: HttpClientOptions) => ({
        requestInterceptor: ctxConfig?.requestInterceptor ?? appConfig?.requestInterceptor,
        responseInterceptor: ctxConfig?.responseInterceptor ?? appConfig?.responseInterceptor,
        responseHandler: ctxConfig?.responseHandler ?? appConfig?.responseHandler,
        requestOptions: {
            ...appConfig?.init,
            ...ctxConfig?.init,
            headers: {
                ...appConfig?.init?.headers,
                ...ctxConfig?.init?.headers,
            }
        }
    });

    // Helper to merge Context Level and Request Level (Request wins)
    const resolveConfig = (ctxConfig?: HttpClientOptions) => (reqOptions?: RequestOptions) => {
        return {
            requestInterceptor: reqOptions?.requestInterceptor ?? ctxConfig?.requestInterceptor,
            responseInterceptor: reqOptions?.responseInterceptor ?? ctxConfig?.responseInterceptor,
            responseHandler: reqOptions?.responseHandler ?? ctxConfig?.responseHandler ?? defaultResponseHandler,
            requestOptions: {
                ...ctxConfig?.init,
                ...reqOptions?.init,
                headers: {
                    ...ctxConfig?.init?.headers,
                    ...reqOptions?.init?.headers,
                }
            }
        };
    };

    /**
     * Level 2: Context (Factory)
     * 
     * **PURPOSE:**
     * This function instantiates the actual HTTP client object (exposing `get`, `post`, etc.). 
     * It is designed to represent a specific "Context" or "Domain" within your application—for 
     * example, creating a dedicated `UsersClient` that always hits `/users`, or a `BillingClient` 
     * that requires a unique set of headers.
     * 
     * **HOW THE CASCADE WORKS:**
     * Settings provided at this Level 2 sit in the middle of the cascade. They will automatically 
     * override any overlapping configurations inherited from Level 1 (Application). In turn, 
     * these Context settings act as the default values for Level 3 (individual Requests), meaning 
     * a one-off request can still override them if needed.
     * 
     * * **Note:** If your application is small and doesn't require global (Level 1) configuration, 
     * you can bypass `defineHttpClient` and use this function directly to create your client.
     * 
     * @param contextConfig - Configurations bound to this specific domain/service.
     * @returns An initialized `HttpClient` ready to execute network requests.
     */
    return function createClient(clientOptions?: HttpClientOptions): HttpClient {

        const mergedOptions = mergeOptions(configurationOptions)(clientOptions);

        /**
         * Level 3: Request (Execution)
         * Core execution pipeline for all HTTP methods. Handles configuration resolution,
         * URL construction, headers merging, and interceptor execution.
         */
        async function request<TResult = any>(method: string, endpoint?: string, body?: any, reqOptions?: RequestOptions): Promise<TResult> {

            const config = resolveConfig(mergedOptions)(reqOptions);

            // Clean up URL concatenation to prevent double slashes
            const baseUrl = configurationOptions.baseUrl?.replace(/\/$/, '') ?? '';
            const controller = clientOptions?.urlSuffix ? `/${clientOptions.urlSuffix.replace(/^\/|\/$/g, '')}` : '';
            const path = endpoint ? `/${endpoint.replace(/^\//, '')}` : '';
            const url = `${baseUrl}${controller}${path}`;

            const headers = new Headers(config.requestOptions?.headers);

            // Auto-inject JSON content type if sending a body
            if (body && !headers.has('Content-Type')) {
                headers.set('Content-Type', 'application/json');
            }

            let fetchOptions: RequestInit = {
                method,
                ...config.requestOptions,
                headers,
                body: body ? JSON.stringify(body) : undefined,
            };

            // 1. Run Request Interceptor (if defined)
            if (config.requestInterceptor) {
                fetchOptions = await config.requestInterceptor(url, fetchOptions);
            }

            // 2. Execute Request
            let response = await fetch(url, fetchOptions);

            // 3. Run Response Interceptor (if defined)
            if (config.responseInterceptor) {
                response = await config.responseInterceptor(response);
            }

            // 4. Handle and parse the final response
            return await config.responseHandler(response);
        }

        return {
            get: <TResult = any>(endpoint?: string, options?: RequestOptions) => request<TResult>("GET", endpoint, undefined, options),
            post: <TResult = any>(endpoint?: string, body?: any, options?: RequestOptions) => request<TResult>("POST", endpoint, body, options),
            put: <TResult = any>(endpoint?: string, body?: any, options?: RequestOptions) => request<TResult>("PUT", endpoint, body, options),
            delete: <TResult = any>(endpoint?: string, body?: any, options?: RequestOptions) => request<TResult>("DELETE", endpoint, body, options),
            patch: <TResult = any>(endpoint?: string, body?: any, options?: RequestOptions) => request<TResult>("PATCH", endpoint, body, options)
        };
    }
}

export const HttpClient = {
    configure: configureHttpClient
}





/**
 * A type that cannot have inner fields and are compared by value
 */
export type PrimitiveType = number | string | undefined | null | bigint | boolean | symbol;

/**
 * A type that can have inner fields and are compared by reference
 */
export type NonPrimitiveType = object | { [key: string]: unknown } | unknown[] | Function;

type EnumComplement<Type extends string, Base = unknown> = {
    __type: Type,
    __name: string,
    __base?: Base;
}

type PrimitiveEnum<T extends PrimitiveType, Type extends string> = T & EnumComplement<Type, T>;

type NonPrimitiveEnum<T extends NonPrimitiveType, Type extends string> = T & EnumComplement<Type, T>;

function npTransform<
    T extends NonPrimitiveType,
    Type extends string,
    E extends NonPrimitiveEnum<T, Type>
>(value: T, name: string, key: Type): E {
    const valor = value as unknown as E;
    valor.__name = name;
    valor.__type = key;
    return valor;
}

function npDisplayFactory<
    T extends NonPrimitiveType,
    Type extends string,
    E extends NonPrimitiveEnum<T, Type>
>(): (e: E) => string {
    return function (e: E) {
        return e.__name;
    }
}

function npParseFactory<
    T extends NonPrimitiveType,
    Values extends Record<string, T>,
    Type extends string,
    E extends NonPrimitiveEnum<T, Type>
>(values: Values, key: Type, comparer: EqualityComparer<T>): (v: T) => E {
    return function (value: T): E {
        const entry = Object.entries(values).find(([k, v]) => comparer(value, v));
        if (!entry) {
            throw new Error("Cannot parse value");
        }
        return npTransform(value, entry[0], key);
    }
}

function npSpreadFactory<
    T extends NonPrimitiveType,
    Values extends Record<string, T>,
    Type extends string,
    E extends NonPrimitiveEnum<T, Type>
>(values: Values, key: Type): { [K in keyof Values]: E } {
    const obj: any = {};
    Object.entries(values).forEach(([k, v]) => obj[k] = npTransform(v, k, key));
    return obj;
}

function npValuesFactory<
    T extends NonPrimitiveType,
    Values extends Record<string, T>,
    Type extends string,
    E extends NonPrimitiveEnum<T, Type>
>(values: Values, key: Type): E[] {
    return Object.entries(values).map(([k, v]) => npTransform(v, k, key));
}

function npDefine<
    T extends NonPrimitiveType,
    Values extends Record<string, T>,
    Type extends string,
    E extends NonPrimitiveEnum<T, Type>
>(values: Values, key: Type, comparer: EqualityComparer<T>, customDisplay?: (e: E) => string) {
    const display = customDisplay ?? npDisplayFactory<T, Type, E>();
    return {
        ...npSpreadFactory<T, Values, Type, E>(values, key),
        values: npValuesFactory<T, Values, Type, E>(values, key),
        parse: npParseFactory<T, Values, Type, E>(values, key, comparer),
        display: display,
    };
}



function pCast<T>(value: any): T {
    return value as unknown as T;
}

function pDisplayFactory<
    T extends PrimitiveType,
    Values extends Record<string, T>,
    Type extends string,
    E extends PrimitiveEnum<T, Type>
>(values: Values): (e: E) => string {
    return function (e: E) {
        return Object.entries(values).find(([k, v]) => pCast<T>(e) === v)![0];
    }
}

function pParseFactory<
    T extends PrimitiveType,
    Values extends Record<string, T>,
    Type extends string,
    E extends PrimitiveEnum<T, Type>
>(values: Values): (v: T) => E {
    return function (value: T): E {
        const entry = Object.entries(values).find(([k, v]) => value === v);
        if (!entry) {
            throw new Error("Cannot parse value");
        }
        return pCast<E>(entry[1]);
    }
}

function pSpreadFactory<
    T extends PrimitiveType,
    Values extends Record<string, T>,
    Type extends string,
    E extends PrimitiveEnum<T, Type>
>(values: Values): { [K in keyof Values]: T } {
    const obj: any = {};
    Object.entries(values).forEach(([k, v]) => obj[k] = pCast<E>(v));
    return obj;
}

function pValuesFactory<
    T extends PrimitiveType,
    Values extends Record<string, T>,
    Type extends string,
    E extends PrimitiveEnum<T, Type>
>(values: Values): E[] {
    return Object.values(values).map(pCast<E>);
}

function pDefine<
    T extends PrimitiveType,
    Values extends Record<string, T>,
    Type extends string,
    E extends PrimitiveEnum<T, Type>
>(values: Values, customDisplay?: (e: E) => string) {
    const display = customDisplay ?? pDisplayFactory<T, Values, Type, E>(values);
    return {
        ...pSpreadFactory<T, Values, Type, E>(values),
        values: pValuesFactory<T, Values, Type, E>(values),
        parse: pParseFactory<T, Values, Type, E>(values),
        display: display,
    };
}

const PrimitiveEnum = { define: pDefine };

const NonPrimitiveEnum = { define: npDefine };

export namespace Enum {

    export const Primitive = PrimitiveEnum;

    export type Primitive<
        T extends PrimitiveType,
        Type extends string
    > = PrimitiveEnum<T, Type>;

    export const NonPrimitive = NonPrimitiveEnum;
    
    export type NonPrimitive<
        T extends NonPrimitiveType,
        Type extends string,
    > = NonPrimitiveEnum<T, Type>;

    export type Complement<Type extends string> = EnumComplement<Type>;

    export type Values<TEnum> = TEnum extends EnumComplement<any, infer Base>
        ? Record<string, Base>
        : never;
}



export type NestedKeyOf<TObject extends object> = {
  [Key in keyof TObject & (string | number)]: TObject[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<TObject[Key]>}`
    : `${Key}`;
}[keyof TObject & (string | number)];

// Infers the exact type at the end of the dot-notation path
export type NestedValueOf<TObject, TPath extends string> = 
  // Base case: If the path is a direct key (e.g., 'id' or 'profile')
  TPath extends keyof TObject 
    ? TObject[TPath] 
    // Recursive case: If the path has a dot (e.g., 'profile.name')
    : TPath extends `${infer Key}.${infer Rest}`
      ? Key extends keyof TObject
        ? NestedValueOf<TObject[Key], Rest>
        : never
      : never;

export type Nest<TObject extends object> = TObject & {
  [Path in NestedKeyOf<TObject>]: NestedValueOf<TObject, Path>;
};

// 1. Create a private Symbol that acts as our secret key
const RAW_TARGET = Symbol('RAW_TARGET');

function traverse(prop: string, target: any) {
  const parts = prop.split('.');
  let current = target;
  const traversed: string[] = [];

  for (let i = 0; i < parts.length; i++) {

    if (current == null || current == undefined) {
      const failedPath = traversed.join('.');
      throw new TypeError(
        `Nested-Proxy Error: Failed to resolve path '${prop}'. The property '${failedPath}' evaluated to ${String(current)}.`
      );
    }

    traversed.push(parts[i]);
    current = current[parts[i]];
  }

  return current;
}

export const Nest = {
  for<TObject extends object>(obj: TObject): Nest<TObject> {
    return new Proxy(obj as any, {
      get(target, prop) {
        if (prop === RAW_TARGET) {
          return target;
        }
        if (typeof prop === 'string' && prop.includes('.')) {
          return traverse(prop, target);
        }
        return Reflect.get(target, prop);
      }
    });
  },
  unwrap<TObject extends object>(nestObj: Nest<TObject>): TObject {
    return (nestObj as any)[RAW_TARGET];
  }
};
