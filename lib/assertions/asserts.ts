/**
 * Asserts that a given condition is true. If the condition is false, throws an error.
 * 
 * @param condition - The boolean value or a function returning a boolean to evaluate.
 * @param message - An optional custom error message or Error object to throw.
 * @throws {Error} If the condition evaluates to false.
 */
export function assert(condition: boolean, message?: string | Error): asserts condition;
export function assert(condition: () => boolean, message?: string | Error): void;
export function assert(condition: boolean | (() => boolean), message?: string | Error): void {
  const result = typeof condition === "function" ? condition() : condition;
  
  if (!result) {
    let error: Error;
    if (message instanceof Error) {
      error = message;
    } else if (typeof message === "string") {
      error = new Error(message);
    } else {
      error = new Error("Assertion failed");
    }
    console.error(error);
    throw error;
  }
}

/** 
 * Asserts that a given condition is false. If the condition is true, throws an error.
 * 
 * @param condition - The boolean value or a function returning a boolean to evaluate.
 * @param message - An optional custom error message or Error object to throw.
 * @throws {Error} If the condition evaluates to true.
 */
export function assertFalse(condition: boolean, message?: string | Error): asserts condition is false;
export function assertFalse(condition: () => boolean, message?: string | Error): void;
export function assertFalse(condition: boolean | (() => boolean), message?: string | Error): void {
  const result = typeof condition === "function" ? condition() : condition;
  assert(!result, message ?? "Assertion failed: expected false");
}