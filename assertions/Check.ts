import { EqualityComparer } from "../common/EqualityComparer";

/**
 * A framework-agnostic namespace containing pure boolean validation functions.
 * Useful for validating conditions without throwing errors.
 */
export namespace Check {
    /** Checks if the subject is strictly null or undefined. */
    export function isNull(subject: unknown): subject is null | undefined {
        return subject === null || subject === undefined;
    }

    /** Checks if the subject is neither null nor undefined. Acts as a type predicate. */
    export function isNotNull<T>(subject: T | null | undefined): subject is T {
        return subject !== null && subject !== undefined;
    }

    /** Checks if the subject is null, undefined, or empty (length of 0). */
    export function isNullOrEmpty<T extends string | Array<unknown>>(subject: T | null | undefined): boolean {
        return isNull(subject) || subject.length === 0;
    }

    /** Checks if the subject is not null, not undefined, and not empty. Acts as a type predicate. */
    export function isNotNullOrEmpty<T extends string | Array<unknown>>(subject: T | null | undefined): subject is T {
        return !isNullOrEmpty(subject);
    }

    // TODO: Change 'null' theme for a 'exists' theme in the above methods
    // export function exists<T>(value: T | null | undefined): value is T {
    //     return value !== undefined && value !== null;
    // }

    /** Checks if the subject is strictly greater than the given minimum. */
    export function isGreaterThan(subject: number, min: number): boolean {
        return subject > min;
    }

    /** Checks if the subject is strictly smaller than the given maximum. */
    export function isSmallerThan(subject: number, max: number): boolean {
        return subject < max;
    }

    /** Checks if the subject is greater than or equal to the given minimum. */
    export function isGreaterThanOrEquals(subject: number, min: number): boolean {
        return subject >= min;
    }

    /** Checks if the subject is smaller than or equal to the given maximum. */
    export function isSmallerThanOrEquals(subject: number, max: number): boolean {
        return subject <= max;
    }

    /** 
     * Checks if the subject is strictly between two limits (exclusive).
     * Automatically determines which limit is the lower/upper bound.
     */
    export function isBetween(subject: number, limit1: number, limit2: number): boolean {
        const lowerLimit = limit1 <= limit2 ? limit1 : limit2;
        const upperLimit = limit1 >= limit2 ? limit1 : limit2;
        return lowerLimit < subject && subject < upperLimit;
    }

    /** 
     * Checks if the subject is between two limits, inclusive of both.
     * Automatically determines which limit is the lower/upper bound.
     */
    export function isBetweenInclusive(subject: number, limit1: number, limit2: number): boolean {
        const lowerLimit = limit1 <= limit2 ? limit1 : limit2;
        const upperLimit = limit1 >= limit2 ? limit1 : limit2;
        return lowerLimit <= subject && subject <= upperLimit;
    }

    /** 
     * Checks if the subject equals another value. 
     * Defaults to strict equality check (`===`), but allows a custom comparer.
     */
    export function equals<T>(subject: T, other: T, comparer?: EqualityComparer<T>): boolean {
        if (comparer) {
            return comparer(subject, other);
        }
        return subject === other;
    }

    /** 
     * Checks if the subject does not equal another value. 
     * Defaults to strict inequality check (`!==`), but allows a custom comparer.
     */
    export function notEquals<T>(subject: T, other: T, comparer?: EqualityComparer<T>): boolean {
        return !equals(subject, other, comparer);
    }

    /** 
     * Checks if the subject loosely equals another value using the '==' operator. 
     */
    export function looseEquals(subject: unknown, other: unknown): boolean {
        // eslint-disable-next-line eqeqeq
        return subject == other;
    }

    /** 
     * Checks if the subject does not loosely equal another value using the '!=' operator. 
     */
    export function looseNotEquals(subject: unknown, other: unknown): boolean {
        // eslint-disable-next-line eqeqeq
        return subject != other;
    }
}