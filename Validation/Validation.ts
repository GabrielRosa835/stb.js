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