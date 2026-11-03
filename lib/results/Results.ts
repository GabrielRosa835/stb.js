import { Attempt } from "./Attempt";
import { Maybe } from "./Maybe";

export namespace Results
{
    /** Creates a successful Attempt with a value. */
    export function success<S = void, F = Error>(value: S): Attempt<S, F>;
    /** Creates a successful Attempt without a value (void context). */
    export function success<F = Error>(): Attempt<void, F>;

    export function success(value?: any)
    {
        return Attempt.Success(value);
    }

    /** Creates a failed Attempt with an error value. */
    export function failure<S = void, F = Error>(value: F): Attempt<S, F>;

    /** Creates a failed Attempt without a specific error value. */
    export function failure<S = void>(): Attempt<S, void>;

    export function failure(value?: any)
    {
        return Attempt.Failure(value);
    }

    /** Creates a Maybe containing a value. */
    export function some<T>(value: T): Maybe<T>;

    export function some<T>(value: T): Maybe<T>
    {
        return Maybe.Some(value);
    }

    /** Creates an empty Maybe. */
    export function empty<T>(): Maybe<T>;

    export function empty<T>(): Maybe<T>
    {
        return Maybe.None();
    }

    /** Returns `Some` if the value is defined, `None` otherwise. */
    export function perhaps<T>(value: T | null | undefined): Maybe<NonNullable<T>>
    {
        return value !== null && value !== undefined
            ? some(value as NonNullable<typeof value>)
            : empty();
    }
}