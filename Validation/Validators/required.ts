import { Validation } from "../Validation";

export const REQUIRED_VALIDATION_ERROR_CODE = "VALIDATION_REQUIRED";

export const required = <T>(): Validation<T> => (entry) => {
    if (entry !== null && entry !== undefined) {
        return Validation.success();
    }
    
    return Validation.failure(Validation.error({
        message: "", // TODO: default message
        attempted: entry,
        code: REQUIRED_VALIDATION_ERROR_CODE,
    }));
};