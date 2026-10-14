export type Success<S = void> = {
    readonly isSuccess: true;
    readonly isFailure: false
} & (S extends void ? {} : { readonly value: S });

export type Failure<F = Error> = {
    readonly isSuccess: false;
    readonly isFailure: true
} & (F extends void ? {} : { readonly value: F });

export type Attempt<S = void, F = Error> = Success<S> | Failure<F>;

interface AttemptModule {
    // Factories
    success<S, F = Error>(value: S): Attempt<S, F>;
    success<F = Error>(): Attempt<void, F>;
    failure<F, S = void>(value: F): Attempt<S, F>;
    failure<S = void>(): Attempt<S, Error>;

    /** Transforms the successful value, bypassing failures. */
    map<S, F, NewS>(attempt: Attempt<S, F>, fn: (value: S) => NewS): Attempt<NewS, F>;

    /** Chains another Attempt-returning operation, bypassing failures. */
    flatMap<S, F, NewS, NewF>(attempt: Attempt<S, F>, fn: (value: S) => Attempt<NewS, NewF>): Attempt<NewS, F | NewF>;

    /** Extracts the successful value, or throws an error if it failed. */
    unwrap<S, F>(attempt: Attempt<S, F>): S;

    /** Extracts the successful value, or returns the provided fallback if it failed. */
    unwrapOr<S, F, Fallback>(attempt: Attempt<S, F>, fallback: Fallback): S | Fallback;
}

function success(value?: any) {
    // If value is provided, attach it. Otherwise, omit it for void contexts.
    const base = { isSuccess: true as const, isFailure: false as const };
    return (value !== undefined ? { ...base, value } : base) as any;
}

function failure(value?: any) {
    const base = { isSuccess: false as const, isFailure: true as const };
    return (value !== undefined ? { ...base, value } : base) as any;
}

function map<S, F, NewS>(attempt: Attempt<S, F>, fn: (value: S) => NewS): Attempt<NewS, F> {
    if (attempt.isFailure) return attempt as any;
    // We safely cast because if it's a Success, the value exists (or is intentionally undefined for void)
    return success(fn((attempt as any).value));
}

function flatMap<S, F, NewS, NewF>(attempt: Attempt<S, F>, fn: (value: S) => Attempt<NewS, NewF>): Attempt<NewS, F | NewF> {
    if (attempt.isFailure) return attempt as any;
    return fn((attempt as any).value);
}

function unwrap<S, F>(attempt: Attempt<S, F>): S {
    if (attempt.isSuccess) return (attempt as any).value;
    throw new Error("Trying to unwrap a failed Attempt object");
}

function unwrapOr<S, F, Fallback>(attempt: Attempt<S, F>, fallback: Fallback): S | Fallback {
    if (attempt.isSuccess) return (attempt as any).value;
    return fallback;
}

export const Attempt: AttemptModule = {
    success,
    failure,
    map,
    flatMap,
    unwrap,
    unwrapOr,
}