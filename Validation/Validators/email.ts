import { Validation } from "../Validation";

const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
export const EMAIL_VALIDATION_ERROR_CODE = "VALIDATION_EMAIL";

export function email(): Validation<string> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        if (EMAIL_REGEX.test(entry)) {
            return ctx.success();
        }

        return ctx.failure({
            message: "", // TODO: Create a default message
            attempted: entry,
            code: EMAIL_VALIDATION_ERROR_CODE,
        });
    };
}