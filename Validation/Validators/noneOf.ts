import { Validation } from "../Validation";

export const NONE_OF_VALIDATION_ERROR_CODE = "VALIDATION_NONE_OF";

type EqualityComparer<T> = (left: T, right: T) => boolean;

export const noneOf = <T>(forbiddenValues: T[], comparer?: EqualityComparer<T>): Validation<T> => (entry) => {
    if (entry === null || entry === undefined) {
        return Validation.success();
    }
    if (comparer && !forbiddenValues.some(t => comparer(entry, t))) {
        return Validation.success();
    }
    if (!forbiddenValues.includes(entry)) {
        return Validation.success();
    }
    const defaultMsg = `O valor não pode ser um dos seguintes: ${forbiddenValues.join(", ")}.`;

    return Validation.failure(Validation.error({
        message: defaultMsg,
        attempted: entry,
        code: NONE_OF_VALIDATION_ERROR_CODE,
    }));
};