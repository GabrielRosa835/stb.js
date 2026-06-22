import { Validation } from "../Validation";

export const all: <T>(...validations: Validation<T>[]) => Validation<T> = (...validators) => (entry) => {

    if (entry === null || entry === undefined) {
        return Validation.success();
    }

    const errors: Validation.Error[] = [];
    for (const validate of validators) {
        const result = validate(entry);
        if (!result.isValid) {
            errors.push(...result.errors);
        }
    }
    if (errors.length > 0) {
        return Validation.failure(errors);
    }
    return Validation.success();
};