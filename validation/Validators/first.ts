import { Validation } from "../Validation";

export const first = <T>(...validations: Validation<T>[]): Validation<T> => (entry, entryContext) => {

    const ctx = entryContext ?? Validation;

    if (entry === null || entry === undefined) {
        return ctx.success();
    }

    for (const validate of validations) {
        const result = validate(entry, ctx);
        if (!result.isValid) {
            return ctx.failure(result.errors[0]);
        }
    }

    return ctx.success();
};