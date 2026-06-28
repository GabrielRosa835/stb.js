import { Validation } from "../Validation";
import { EqualityComparer } from "../../Common/EqualityComparer";

export const ONE_OF_VALIDATION_ERROR_CODE = "VALIDATION_ONE_OF";

export function oneOf<T>(allowedValues: T[], comparer?: EqualityComparer<T>): Validation<T> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        if (comparer && allowedValues.some(t => comparer(entry, t))) {
            return ctx.success();
        }
        if (allowedValues.includes(entry)) {
            return ctx.success();
        }

        const defaultMsg = `O valor deve ser um dos seguintes: ${allowedValues.join(", ")}.`;

        return ctx.failure({
            message: defaultMsg,
            attempted: entry,
            code: ONE_OF_VALIDATION_ERROR_CODE,
        });
    };
}