import { Validation } from "../Validation";

export const field = <T extends object, K extends keyof T>(
    field: K,
    validator: Validation<T[K]>,
): Validation<T> => (entry) => {

    if (entry === null || entry === undefined) {
        return Validation.success();
    }

    const propertyValue = entry[field];
    const result = validator(propertyValue);

    if (result.isValid) {
        return result;
    }

    // Map errors to build the path chain (e.g., "parent.child.grandchild")
    const mappedErrors = result.errors.map(err => Validation.error({
        ...err,
        message: err.message,
        property: err.property ? `${String(field)}.${err.property}` : String(field),
        attempted: err.attempted !== undefined ? err.attempted : propertyValue,
    }));

    return Validation.failure(mappedErrors);
};