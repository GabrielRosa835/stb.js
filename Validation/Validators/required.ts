import { Validation } from "../Validation";

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