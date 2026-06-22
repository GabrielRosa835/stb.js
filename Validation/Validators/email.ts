import { Validation } from "../Validation";

const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
export const EMAIL_VALIDATION_ERROR_CODE = "VALIDATION_EMAIL";

export const email = (): Validation<string> => (entry) => {
    if (entry === null || entry === undefined) {
        return Validation.success();
    }
    if (EMAIL_REGEX.test(entry)) {
        return Validation.success();
    }

    return Validation.failure(Validation.error({
        message: "", // TODO: Create a default message
        attempted: entry,
        code: EMAIL_VALIDATION_ERROR_CODE,
    }));
};