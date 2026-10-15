import { Validation } from "../Validation";

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