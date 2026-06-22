import { Validation } from "../Validation";

export const select = <T, V>(
    accessor: (entry: T) => V,
    validator: Validation<V>,
    pathName?: string // Optional pathing as the 'property' identifier
): Validation<T> => (entry) => {
    if (entry === null || entry === undefined) {
        return Validation.success();
    }

    const selectedValue = accessor(entry);
    const result = validator(selectedValue);

    if (result.isValid) {
        return result;
    }

    // Map errors using the provided pathName
    const errors = result.errors.map(err => Validation.error({
        ...err,
        message: err.message,
        property: pathName ? err.property ? `${pathName}.${err.property}` : pathName : undefined,
        attempted: err.attempted !== undefined ? err.attempted : selectedValue,
    }));

    return Validation.failure(errors);
};