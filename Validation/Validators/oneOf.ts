import { Validation } from "../Validation";

export const ONE_OF_VALIDATION_ERROR_CODE = "VALIDATION_ONE_OF";

type EqualityComparer<T> = (left: T, right: T) => boolean;

export const oneOf = <T>(allowedValues: T[], equalityComparer?: EqualityComparer<T>): Validation<T> => (entry: T) => {

    if (entry === null || entry === undefined) {
        return Validation.success();
    }

    if (equalityComparer && allowedValues.some(t => equalityComparer(entry, t))) {
        return Validation.success();
    }
    if (allowedValues.includes(entry)) {
        return Validation.success();
    }

    const defaultMsg = `O valor deve ser um dos seguintes: ${allowedValues.join(", ")}.`;

    return Validation.failure(Validation.error({
        message: defaultMsg,
        attempted: entry,
        code: ONE_OF_VALIDATION_ERROR_CODE,
    }));
};