export type ValidationSeverity = "error" | "warning" | "info"

export type ValidationResult = {
    errors: ValidationError[];
    isValid: boolean;
}

export type ValidationError = {
    /** The error message */
    message: string;
    /** The name of the property */
    property?: string;
    /** The property value that caused the failure */
    attempted?: any;
    /** Custom state associated with the failure */
    state?: any;
    /** Custom severity level associated with the failure */
    severity: ValidationSeverity;
    /** Gets or sets the error code */
    code?: string;
}

export type Validation<T> = (entry: T) => ValidationResult;

export type ErrorLike = string | ValidationError;

const failure: (error: ErrorLike | ErrorLike[], ...errors: ErrorLike[]) => ValidationResult = (error, ...errors) => {
    function toError(msg: ErrorLike): ValidationError {
        return typeof msg === "string" ? { message: msg, severity: "error" } : msg;
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

const success: () => ValidationResult = () => ({ errors: [], isValid: true });

const error = (
    message: string,
    property?: string,
    attempted?: any,
    state?: any,
    severity?: ValidationSeverity,
    code?: string)
    : ValidationError => ({
        message,
        property,
        attempted,
        state,
        severity: severity ?? "error",
        code,
    });

export const Validation = {
    failure,
    success,
    error,
}