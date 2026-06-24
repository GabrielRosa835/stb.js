import { Validation } from "../Validation";

type InRangeDefinition = {
    min?: number,
    max?: number,
}

export const IN_RANGE_VALIDATION_ERROR_CODE = "VALIDATION_IN_RANGE";

export function inRange({ min, max }: InRangeDefinition): Validation<number> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined || Number.isNaN(entry)) {
            return ctx.success();
        }

        const tooSmall = min !== undefined && entry < min;
        const tooLarge = max !== undefined && entry > max;

        if (!tooSmall && !tooLarge) {
            return ctx.success();
        }

        let defaultMsg = "Valor fora do limite permitido.";
        if (min !== undefined && max !== undefined) {
            defaultMsg = `O valor deve estar entre ${min} e ${max}.`;
        } else if (min !== undefined) {
            defaultMsg = `O valor deve ser no mínimo ${min}.`;
        } else if (max !== undefined) {
            defaultMsg = `O valor deve ser no máximo ${max}.`;
        }

        return ctx.failure({
            message: defaultMsg, // TODO: default message
            attempted: entry,
            code: IN_RANGE_VALIDATION_ERROR_CODE,
        });
    };
}