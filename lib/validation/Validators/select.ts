import { Validation } from "../Validation";

export function select<T, V>(
    accessor: (entry: T) => V, 
    validator: Validation<V>,
    /** Optional pathing as the 'property' identifier */
    pathName?: string
): Validation<T> {
    return (entry, entryContext) => {

        const ctx = entryContext ?? Validation;

        if (entry === null || entry === undefined) {
            return ctx.success();
        }

        const selectedValue = accessor(entry);
        const result = validator(selectedValue, ctx);

        if (result.isValid) {
            return result;
        }

        // Map errors using the provided pathName
        const errors = result.errors.map(err => ({
            ...err,
            property: pathName ? err.property ? `${pathName}.${err.property}` : pathName : undefined,
            attempted: err.attempted !== undefined ? err.attempted : selectedValue,
        }));

        return ctx.failure(errors);
    };
}