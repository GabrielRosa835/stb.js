import { Validation } from "../Validation";

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