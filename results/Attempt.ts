import { Results } from "./Results";

/**
 * A discriminated union representing an operation that can either succeed or fail.
 * This pattern encourages explicit error handling and avoids throwing exceptions.
 */
export type Attempt<S = void, F = Error> = (Attempt.Success<S> | Attempt.Failure<F>) & Attempt.Extensions<S, F>;

export namespace Attempt
{
    /**
     * Represents a successful outcome of an operation.
     */
    export type Success<S = void> = {
        readonly isSuccess: true;
        readonly isFailure: false;
        readonly value: S;
    };

    export function Success<S = void, F = Error>(value: S): Attempt<S, F>
    {
        const success: Success<S> = {
            isSuccess: true,
            isFailure: false,
            value: value,
        };
        return new ExtensionsImpl(success as Attempt<S, F>) as Attempt<S, F>;
    }

    /**
     * Represents a failed outcome of an operation.
     */
    export type Failure<F = Error> = {
        readonly isSuccess: false;
        readonly isFailure: true;
        readonly value: F;
    };

    export function Failure<S = void, F = Error>(value: F): Attempt<S, F>
    {
        const failure: Failure<F> = {
            isSuccess: false,
            isFailure: true,
            value: value,
        };
        return new ExtensionsImpl(failure as Attempt<S, F>) as Attempt<S, F>;
    }

    export function either<S, F, R>(attempt: Success<S> | Failure<F>, onSuccess: (value: S) => R, onFailure: (failure: F) => R): R
    {
        if (attempt.isSuccess)
        {
            return onSuccess(attempt.value);
        }
        else
        {
            return onFailure(attempt.value);
        }
    }

    export interface Extensions<S, F>
    {
        /**
         * Extracts a single value from the Attempt by applying one of two functions 
         * based on whether it is a success or a failure.
         */
        either<R>(onSuccess: (value: S) => R, onFailure: (failure: F) => R): R;

        /** 
         * Transforms the successful value using the provided function, bypassing failures. 
         */
        map<S2>(mapper: (value: S) => S2): Attempt<S2, F>;

        /**
         * Transforms the failure value using the provided function, bypassing successes.
         */
        mapFailure<F2>(mapper: (failure: F) => F2): Attempt<S, F2>;

        /** 
         * Chains another Attempt-returning operation if the current Attempt is successful, bypassing failures. 
         */
        bind<S2, F2>(mapper: (value: S) => Attempt<S2, F2>): Attempt<S2, F | F2>;

        bindFailure<S2, F2>(mapper: (value: F) => Attempt<S2, F2>): Attempt<S | S2, F2>;

        /** 
         * Extracts the successful value, or throws an error if it failed. 
         * Use with caution. 
         */
        unwrap(): S;

        /** 
         * Extracts the successful value, or returns the provided fallback if it failed. 
         */
        unwrapOr<Fallback>(fallback: Fallback): S | Fallback;

        /** 
         * Extracts the successful value, or returns the provided fallback if it failed. 
         */
        unwrapOr<Fallback>(fallbackProvider: () => Fallback): S | Fallback;
    }

    class ExtensionsImpl<S, F> implements Extensions<S, F>
    {
        private readonly instance: Success<S> | Failure<F>;

        constructor (attempt: Success<S> | Failure<F>)
        {
            this.instance = attempt;
        }

        get isSuccess(): boolean { return this.instance.isSuccess; }
        get isFailure(): boolean { return this.instance.isFailure; }
        get value(): S | F { return this.instance.value; }

        either<R>(onSuccess: (value: S) => R, onFailure: (failure: F) => R): R
        {
            return either(this.instance, onSuccess, onFailure);
        }
        unwrap(): S
        {
            return either(this.instance, s => s, f => { throw f; });
        }
        unwrapOr<Fallback>(fallback: Fallback): S | Fallback;
        unwrapOr<Fallback>(fallbackProvider: () => Fallback): S | Fallback;
        unwrapOr(_fallback: unknown)
        {
            return either(this.instance, s => s, () => typeof _fallback === "function" ? (_fallback as any)() : _fallback as any);
        }
        map<S2>(mapper: (value: S) => S2): Attempt<S2, F>
        {
            return either(this.instance, s => Success(mapper(s)), f => Failure(f));
        }
        mapFailure<F2>(mapper: (failure: F) => F2): Attempt<S, F2>
        {
            return either(this.instance, s => Success(s), f => Failure(mapper(f)));
        }
        bind<S2, F2>(mapper: (value: S) => Attempt<S2, F2>): Attempt<S2, F | F2>
        {
            return either(this.instance, s => mapper(s), f => Failure<S2, F | F2>(f));
        }
        bindFailure<S2, F2>(mapper: (value: F) => Attempt<S2, F2>): Attempt<S | S2, F2>
        {
            return either(this.instance, s => Success<S | S2, F2>(s), f => mapper(f));
        }
    }
}