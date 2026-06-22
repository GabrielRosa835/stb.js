import { Validation } from "../Validation";

export const forEach = <T>(validator: Validation<T>, customMessage?: string): Validation<T[]> => (entry) => {
    if (entry === null || entry === undefined || !Array.isArray(entry)) {
        return Validation.success();
    }

    const errors: Validation.Error[] = [];

    entry.forEach((item, index) => {
        const result = validator(item);

        if (!result.isValid) {
            // Map the errors to inject the array index into the property path
            const mappedErrors = result.errors.map(err => Validation.error({
                ...err,
                message: customMessage ? customMessage : err.message,
                property: err.property ? `[${index}].${err.property}` : `[${index}]`,
                attempted: err.attempted !== undefined ? err.attempted : item,
            }));

            errors.push(...mappedErrors);
        }
    });

    if (errors.length > 0) {
        return Validation.failure(errors);
    }
    return Validation.success();
};