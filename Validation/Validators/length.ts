import { Validation } from "../Validation";

type LengthDefinition = {
    min?: number,
    max?: number,
}

export const LENGTH_VALIDATION_ERROR_CODE = "VALIDATION_LENGTH";

export const length = <T extends string | unknown[]>({ min, max }: LengthDefinition): Validation<T> => (entry) => {
    if (entry === null || entry === undefined) {
        return Validation.success();
    }

    const len = entry.length;
    const tooShort = min !== undefined && len < min;
    const tooLong = max !== undefined && len > max;

    if (!tooShort && !tooLong) {
        return Validation.success();
    }

    // Construct a sensible default message based on provided arguments
    let defaultMsg = "Tamanho inválido.";
    if (min !== undefined && max !== undefined) {
        defaultMsg = `O tamanho deve estar entre ${min} e ${max}.`;
    } else if (min !== undefined) {
        defaultMsg = `O tamanho mínimo é ${min}.`;
    } else if (max !== undefined) {
        defaultMsg = `O tamanho máximo é ${max}.`;
    }

    return Validation.failure(Validation.error({
        message: defaultMsg,
        attempted: entry,
        code: LENGTH_VALIDATION_ERROR_CODE,
    }));
};