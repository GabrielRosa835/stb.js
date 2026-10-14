export type Some<T> = { readonly isPresent: true; readonly isEmpty: false; readonly value: T };
export type Empty = { readonly isPresent: false; readonly isEmpty: true };
export type Maybe<T> = Some<T> | Empty;

interface MaybeModule {

    some<T>(value: T): Maybe<T>;
    empty<T = never>(): Maybe<T>;

    /** Bridges standard JS null/undefined into the Maybe pattern. */
    perhaps<T>(value: T | null | undefined): Maybe<NonNullable<T>>;

    /** Transforms the present value, bypassing empty states. */
    map<T, U>(maybe: Maybe<T>, fn: (value: T) => U): Maybe<U>;

    /** Chains another Maybe-returning operation, bypassing empty states. */
    flatMap<T, U>(maybe: Maybe<T>, fn: (value: T) => Maybe<U>): Maybe<U>;

    /** Extracts the value, throwing an error if empty. Use with caution. */
    unwrap<T>(maybe: Maybe<T>): T;

    /** Extracts the value, or returns the provided fallback if empty. */
    unwrapOr<T, Fallback>(maybe: Maybe<T>, fallback: Fallback): T | Fallback;
}

const EMPTY_INSTANCE: Empty = { isPresent: false as const, isEmpty: true as const };

function some<T>(value: T): Maybe<T> {
    return { isPresent: true as const, isEmpty: false as const, value };
}

function empty<T = never>(): Maybe<T> {
    return EMPTY_INSTANCE;
}

function perhaps<T>(value: T | null | undefined): Maybe<NonNullable<T>> {
    return value !== null && value !== undefined
        ? Maybe.some(value as NonNullable<typeof value>)
        : Maybe.empty();
}

function map<T, U>(maybe: Maybe<T>, fn: (value: T) => U): Maybe<U> {
    if (maybe.isEmpty) return maybe as any;
    return Maybe.some(fn((maybe as any).value));
}

function flatMap<T, U>(maybe: Maybe<T>, fn: (value: T) => Maybe<U>): Maybe<U> {
    if (maybe.isEmpty) return maybe as any;
    return fn((maybe as any).value);
}

function unwrap<T>(maybe: Maybe<T>): T {
    if (maybe.isPresent) return (maybe as any).value;
    throw new Error("Trying to unwrap an empty Maybe object");
}

function unwrapOr<T, Fallback>(maybe: Maybe<T>, fallback: Fallback): T | Fallback {
    if (maybe.isPresent) return (maybe as any).value;
    return fallback;
}

export const Maybe: MaybeModule = {
    some,
    empty,
    perhaps,
    map,
    flatMap,
    unwrap,
    unwrapOr,
};