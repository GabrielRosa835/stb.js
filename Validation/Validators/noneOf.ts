import { Validation } from "../Validation";
import { EqualityComparer } from "../../Common/EqualityComparer";

export const NONE_OF_VALIDATION_ERROR_CODE = "VALIDATION_NONE_OF";

export function noneOf<T>(forbiddenValues: T[], comparer?: EqualityComparer<T>): Validation<T> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        if (comparer && !forbiddenValues.some(t => comparer(entry, t))) {
            return ctx.success();
        }
        if (!forbiddenValues.includes(entry)) {
            return ctx.success();
        }

        const defaultMsg = `O valor não pode ser um dos seguintes: ${forbiddenValues.join(", ")}.`;

        return ctx.failure({
            message: defaultMsg,
            attempted: entry,
            code: NONE_OF_VALIDATION_ERROR_CODE,
        });
    };
}