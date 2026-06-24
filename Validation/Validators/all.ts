import { Validation } from "../Validation";

export function all<T>(...validators: Validation<T>[]): Validation<T> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        const errors: Validation.Error[] = [];

        for (const validate of validators) {
            const result = validate(entry, ctx);
            if (!result.isValid) {
                errors.push(...result.errors);
            }
        }

        if (errors.length > 0) {
            return ctx.failure(errors);
        }
        return ctx.success();
    };
}