import { EqualityComparer } from "../common/EqualityComparer";
import { assert } from "./asserts";
import { Check } from "./Check";

/**
 * A namespace combining boolean checks with assertions.
 * Throws an error on validation failure, or returns the subject on success to enable chaining.
 */
export namespace Assert {
    /** Asserts that the subject is null or undefined, returning it on success. */
    export function isNull<T>(subject: T, message?: string | Error): null | undefined {
        assert(Check.isNull(subject), message ?? "Expected subject to be null or undefined");
        return subject as null | undefined;
    }

    /** Asserts that the subject is not null or undefined, returning it on success as a narrowed type. */
    export function isNotNull<T>(subject: T | null | undefined, message?: string | Error): T {
        assert(Check.isNotNull(subject), message ?? "Expected subject to not be null or undefined");
        return subject;
    }

    /** Asserts that the subject is null, undefined, or empty, returning it on success. */
    export function isNullOrEmpty<T extends string | Array<unknown>>(subject: T | null | undefined, message?: string | Error): T | null | undefined {
        assert(Check.isNullOrEmpty(subject), message ?? "Expected subject to be null or empty");
        return subject;
    }

    /** Asserts that the subject is not null, undefined, or empty, returning it on success as a narrowed type. */
    export function isNotNullOrEmpty<T extends string | Array<unknown>>(subject: T | null | undefined, message?: string | Error): T {
        assert(Check.isNotNullOrEmpty(subject), message ?? "Expected subject to not be null or empty");
        return subject;
    }

    /** Asserts that the subject is strictly greater than the given minimum. */
    export function isGreaterThan(subject: number, min: number, message?: string | Error): number {
        assert(Check.isGreaterThan(subject, min), message ?? `Expected ${subject} to be greater than ${min}`);
        return subject;
    }

    /** Asserts that the subject is strictly smaller than the given maximum. */
    export function isSmallerThan(subject: number, max: number, message?: string | Error): number {
        assert(Check.isSmallerThan(subject, max), message ?? `Expected ${subject} to be smaller than ${max}`);
        return subject;
    }

    /** Asserts that the subject is greater than or equal to the given minimum. */
    export function isGreaterThanOrEquals(subject: number, min: number, message?: string | Error): number {
        assert(Check.isGreaterThanOrEquals(subject, min), message ?? `Expected ${subject} to be greater than or equal to ${min}`);
        return subject;
    }

    /** Asserts that the subject is smaller than or equal to the given maximum. */
    export function isSmallerThanOrEquals(subject: number, max: number, message?: string | Error): number {
        assert(Check.isSmallerThanOrEquals(subject, max), message ?? `Expected ${subject} to be smaller than or equal to ${max}`);
        return subject;
    }

    /** Asserts that the subject is strictly between two limits (exclusive). */
    export function isBetween(subject: number, limit1: number, limit2: number, message?: string | Error): number {
        assert(Check.isBetween(subject, limit1, limit2), message ?? `Expected ${subject} to be strictly between ${limit1} and ${limit2}`);
        return subject;
    }

    /** Asserts that the subject is between two limits (inclusive). */
    export function isBetweenInclusive(subject: number, limit1: number, limit2: number, message?: string | Error): number {
        assert(Check.isBetweenInclusive(subject, limit1, limit2), message ?? `Expected ${subject} to be between ${limit1} and ${limit2}`);
        return subject;
    }

    /** Asserts that the subject equals another value. */
    export function equals<T>(subject: T, other: T, comparer?: EqualityComparer<T>, message?: string | Error): T {
        assert(Check.equals(subject, other, comparer), message ?? `Expected ${subject} to equal ${other}`);
        return subject;
    }

    /** Asserts that the subject does not equal another value. */
    export function notEquals<T>(subject: T, other: T, comparer?: EqualityComparer<T>, message?: string | Error): T {
        assert(Check.notEquals(subject, other, comparer), message ?? `Expected ${subject} to not equal ${other}`);
        return subject;
    }

    /** Asserts that the subject loosely equals another value using the '==' operator. */
    export function looseEquals<T>(subject: T, other: unknown, message?: string | Error): T {
        assert(Check.looseEquals(subject, other), message ?? `Expected ${subject} to loosely equal ${other}`);
        return subject;
    }

    /** Asserts that the subject does not loosely equal another value using the '!=' operator. */
    export function looseNotEquals<T>(subject: T, other: unknown, message?: string | Error): T {
        assert(Check.looseNotEquals(subject, other), message ?? `Expected ${subject} to not loosely equal ${other}`);
        return subject;
    }
}