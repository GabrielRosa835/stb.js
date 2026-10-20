/** 
 * A discriminated union representing an operation that may or may not return a desired value.
 * Useful for avoiding null or undefined checks sprinkled throughout the codebase.
 */
export type Maybe<T> = (Maybe.Some<T> | Maybe.None) & Maybe.Extensions<T>;

export namespace Maybe
{
    /** Represents a state where a value is present. */
    export type Some<T> = {
        readonly isPresent: true;
        readonly isEmpty: false;
        readonly value: T;
    };

    export function Some<T>(value: T): Maybe<T>
    {
        const some: Some<T> = {
            isPresent: true,
            isEmpty: false,
            value: value,
        };
        return new ExtensionsImpl(some) as Maybe<T>;
    }

    /** Represents a state where a value is absent. */
    export type None = {
        readonly isPresent: false;
        readonly isEmpty: true;
    };

    export function None<T>(): Maybe<T>
    {
        return NONE;
    }

    export function either<T, R>(maybe: Maybe.Some<T> | Maybe.None, onSome: (value: T) => R, onEmpty: () => R): R
    {
        if (maybe.isPresent)
        {
            return onSome(maybe.value);
        }
        else
        {
            return onEmpty();
        }
    }

    export interface Extensions<T>
    {
        /**
         * Extracts a single value from the Maybe by applying one of two functions 
         * based on whether it has a value or is empty.
         */
        either<R>(onSome: (value: T) => R, onEmpty: () => R): R;

        /** Transforms the present value, bypassing empty states. */
        map<T2>(mapper: (value: T) => T2): Maybe<T2>;

        /** Chains another Maybe-returning operation, bypassing empty states. */
        bind<T2>(mapper: (value: T) => Maybe<T2>): Maybe<T2>;

        /** Extracts the value, throwing an error if empty. Use with caution. */
        unwrap(): T;

        /** Extracts the value, or returns the provided fallback if empty. */
        unwrapOr<Fallback>(fallback: Fallback): T | Fallback;

        /** Extracts the value, or returns the provided fallback if empty. */
        unwrapOr<Fallback>(fallbackProvider: () => Fallback): T | Fallback;

        /** 
         * Filters the Maybe. If it is empty, or if the predicate returns false for the value, 
         * it returns Empty. Otherwise, returns the original Some.
         */
        filter(predicate: (value: T) => boolean): Maybe<T>;
    }

    class ExtensionsImpl<T> implements Extensions<T>
    {
        private readonly instance: Maybe.Some<T> | Maybe.None;

        get isPresent(): boolean { return this.instance.isPresent; }
        get isEmpty(): boolean { return this.instance.isEmpty; }
        get value(): T | void { return (this.instance as any).value; }

        constructor (maybe: Maybe.Some<T> | Maybe.None)
        {
            this.instance = maybe;
        }

        either<R>(onSome: (value: T) => R, onEmpty: () => R): R
        {
            return either(this.instance, onSome, onEmpty);
        }
        map<T2>(mapper: (value: T) => T2): Maybe<T2>
        {
            return either(this.instance, s => Some(mapper(s)), () => None<T2>());
        }
        bind<T2>(mapper: (value: T) => Maybe<T2>): Maybe<T2>
        {
            return either(this.instance, s => mapper(s), () => None<T2>());
        }
        unwrap(): T
        {
            return either(this.instance, s => s, () => { throw new Error("Cannot retrieve value of Maybe. It's empty"); });
        }
        unwrapOr<Fallback>(fallback: Fallback): T | Fallback;
        unwrapOr<Fallback>(fallbackProvider: () => Fallback): T | Fallback;
        unwrapOr<Fallback>(_fallback: unknown): T | Fallback
        {
            return either(this.instance, s => s, () => typeof _fallback === "function" ? (_fallback as any)() : _fallback as any);
        }
        filter(predicate: (value: T) => boolean): Maybe<T>
        {
            return either(this.instance, s => predicate(s) ? Some(s) : None<T>(), () => None<T>());
        }
    }

    const NONE: Maybe<any> = new ExtensionsImpl({
        isEmpty: true,
        isPresent: false,
    } as None) as Maybe<any>;
}