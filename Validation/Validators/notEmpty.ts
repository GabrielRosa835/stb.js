import { Validation } from "../Validation";

export const NOT_EMTPY_VALIDATION_ERROR_CODE = "VALIDATION_NOT_EMPTY";

export const notEmpty = <T extends string | unknown[]>(): Validation<T> => (entry) => {
    
    if (entry === null || entry === undefined) {
        return Validation.success();
    }

    let isEmpty = false;

    if (typeof entry === "string") {
        isEmpty = entry.trim() === "";
    } else if (Array.isArray(entry)) {
        isEmpty = entry.length === 0;
    }

    if (!isEmpty) {
        return Validation.success();
    }
    
    return Validation.failure(Validation.error({
        message: "", // TODO: default message
        attempted: entry,
        code: NOT_EMTPY_VALIDATION_ERROR_CODE,
    }));
};