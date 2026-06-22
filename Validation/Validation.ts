export type Validation<T> = (entry: T) => Validation.Result;

export namespace Validation {

    export type ErrorLike = string | Error;

    export type ErrorDefinition = {
        message: string;
        property?: string;
        code?: string;
        attempted?: any;
        state?: any;
        severity?: Validation.Severity;
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

    export type MessageFormatter = (error: Error) => string | undefined;
    export type ErrorInterceptor = (error: Error) => Error | undefined;
    export type ResultInterceptor = (error: Result) => Result | undefined;

    export type Context = {
        state: unknown;
        addFormatter: (formatter: MessageFormatter) => void;
        addErrorInterceptor: (interceptor: ErrorInterceptor) => void;
        addResultInterceptor: (interceptor: ResultInterceptor) => void;
        messageFor: (error: Validation.Error) => string;
        errorFor: (error: Validation.Error) => Validation.Error;
        resultFor: (error: Validation.Result) => Validation.Result;
    }
}

const createContext = (): Validation.Context => {

    const formatters: Validation.MessageFormatter[] = [];
    const errorInterceptors: Validation.ErrorInterceptor[] = [];
    const resultInterceptors: Validation.ResultInterceptor[] = [];

    function addFormatter(formatter: Validation.MessageFormatter) {
        formatters.push(formatter);
    }
    function addErrorInterceptor(interceptor: Validation.ErrorInterceptor) {
        errorInterceptors.push(interceptor);
    }
    function addResultInterceptor(interceptor: Validation.ResultInterceptor) {
        resultInterceptors.push(interceptor);
    }
    function messageFor(error: Validation.Error): string {
        for (const formatter of formatters) {
            const msg = formatter(error);
            if (msg !== undefined) {
                return msg;
            }
        }
        return error.message;
    }
    function errorFor(error: Validation.Error): Validation.Error {
        for (const interceptor of errorInterceptors) {
            const intercepted = interceptor(error);
            if (intercepted !== undefined) {
                return intercepted;
            }
        }
        return error;
    }
    function resultFor(result: Validation.Result): Validation.Result {
        for (const interceptor of resultInterceptors) {
            const intercepted = interceptor(result);
            if (intercepted !== undefined) {
                return intercepted;
            }
        }
        return result;
    }

    return {
        state: undefined,
        addFormatter,
        addErrorInterceptor,
        addResultInterceptor,
        messageFor,
        errorFor,
        resultFor,
    }
}


const createValidation = () => {

    let _context: Validation.Context = createContext();
    let _contextComparer: ContextComparer | undefined = undefined;
    let _contextListener: ContextListener | undefined = undefined;

    const failure: (error: Validation.ErrorLike | Validation.ErrorLike[], ...errors: Validation.ErrorLike[]) => Validation.Result = (error, ...errors) => {
        function toError(msg: Validation.ErrorLike): Validation.Error {
            const error: Validation.Error = typeof msg === "string" ? { message: msg, severity: "error" } : msg;
            error.message = _context.messageFor(error);
            return _context.errorFor(error);
        }
        let firstErrors;
        if (Array.isArray(error)) {
            if (error.length === 0) {
                throw new Error("Cannot create a failed validation result without errors");
            }
            firstErrors = error.map(toError);
        }
        else {
            firstErrors = [toError(error)];
        }
        return {
            isValid: false,
            errors: errors.length == 0 ? [...firstErrors] : [...firstErrors, ...errors.map(toError)],
        };
    }

    const success: () => Validation.Result = () => {
        return _context.resultFor({ errors: [], isValid: true });
    };

    const error = ({
        message,
        property,
        code,
        attempted,
        state,
        severity
    }: Validation.ErrorDefinition): Validation.Error => {
        const error = {
            message,
            property,
            attempted,
            state,
            severity: severity ?? "error",
            code,
        };
        error.message = _context.messageFor(error);
        return _context.errorFor(error);
    };

    const setContext = (context: Validation.Context) => {
        if (_contextComparer && _contextComparer(_context, context)) {
            return;
        }
        if (context.state !== undefined && Object.is(_context.state, context.state)) {
            return;
        }
        if (_context === context) {
            return;
        }
        
        _context = context;
        if (_contextListener) {
            _contextListener(context);
        }
    }

    type ContextComparer = (ctx1: Validation.Context, ctx2: Validation.Context) => boolean;
    type ContextListener = (context: Validation.Context) => void;

    const onContextChanged = (listener: ContextListener, comparer?: ContextComparer) => {
        _contextListener = listener;
        _contextComparer = comparer;
    }

    return {
        failure,
        success,
        error,
        createContext,
        setContext,
        onContextChanged,
        get context() {
            return _context;
        },
    } as const;
}

export const Validation = createValidation();