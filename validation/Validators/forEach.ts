import { Validation } from "../Validation";

export function forEach<T>(validator: Validation<T>): Validation<T[]> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined || !Array.isArray(entry)) {
            return ctx.success();
        }

        const errors: Validation.ErrorLike[] = [];

        entry.forEach((item, index) => {
            const result = validator(item);

            if (!result.isValid) {

                // Map the errors to inject the array index into the property path
                const mappedErrors = result.errors.map(err => ({
                    ...err,
                    property: err.property ? `[${index}].${err.property}` : `[${index}]`,
                    attempted: err.attempted !== undefined ? err.attempted : item,
                }));

                errors.push(...mappedErrors);
            }
        });

        if (errors.length > 0) {
            return ctx.failure(errors);
        }
        return ctx.success();
    };
}