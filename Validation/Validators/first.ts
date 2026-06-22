import { Validation } from "../Validation";

export const first = <T>(...validations: Validation<T>[]): Validation<T> => (entry) => {
    if (entry === null || entry === undefined) {
        return Validation.success();
    }
    for (const validate of validations) {
        const result = validate(entry);
        if (!result.isValid) {
            return Validation.failure(result.errors[0]);
        }
    }
    return Validation.success();
};