import { Validation } from "../Validation";

export const filter = <T>(predicate: (error: Validation.Error) => boolean, ...validations: Validation<T>[]): Validation<T> => (entry) => {

    if (entry === null || entry === undefined) {
        return Validation.success();
    }

    const errors: Validation.Error[] = [];

    for (const validate of validations) {
        const result = validate(entry);
        if (!result.isValid) {
            const filteredErrors = result.errors.filter(predicate);
            errors.push(...filteredErrors);
        }
    }

    if (errors.length > 0) {
        return Validation.failure(errors);
    }
    return Validation.success();
};