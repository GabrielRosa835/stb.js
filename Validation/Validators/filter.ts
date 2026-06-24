import { Validation } from "../Validation";

type ErrorPredicate = (value: Validation.Error, index: number, array: Validation.Error[]) => boolean;

export function filter<T>(predicate: ErrorPredicate, ...validators: Validation<T>[]): Validation<T> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        const errors: Validation.Error[] = [];

        for (const validate of validators) {
            const result = validate(entry, ctx);
            if (!result.isValid) {
                const filteredErrors = result.errors.filter(predicate);
                errors.push(...filteredErrors);
            }
        }

        if (errors.length > 0) {
            return ctx.failure(errors);
        }
        return ctx.success();
    };
}