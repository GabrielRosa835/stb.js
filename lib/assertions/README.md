# Assertions Toolbox

This module provides a flexible, robust, and extensible set of utilities for validation and assertions across the application. It embraces functional and procedural paradigms while offering ergonomic APIs to reduce boilerplate and improve clarity.

## Overview

The Assertion Toolbox is divided into three main layers:

1. **`assert` & `assertFalse`**: The foundational functions that evaluate conditions and throw strongly-typed errors.
2. **`Check` Namespace**: A collection of framework-agnostic, pure functions that perform validations and return `boolean` values or act as TypeScript type predicates.
3. **`Assert` Namespace**: A convenient wrapper combining `Check` with `assert`. It validates inputs, throws if the validation fails, and returns the subject upon success—making it ideal for inline validation and chaining.

---

## 1. Base Assertions (`asserts.ts`)

The raw assertion functions are used to throw exceptions when unexpected domain failures or invariant breaches occur.

### `assert(condition, message?)`
Evaluates a boolean condition or a function returning a boolean. If the condition is false, it throws an `Error`. Acts as a TypeScript assertion (`asserts condition`) to narrow types.

```typescript
import { assert } from "src/toolbox/Assertions/asserts";

const myVal: string | null = "hello";
assert(myVal !== null, "Value must not be null");
// TypeScript now knows myVal is string
```

### `assertFalse(condition, message?)`
The inverse of `assert`. It throws if the condition is `true`.

---

## 2. Check Namespace (`Check.ts`)

The `Check` namespace provides pure, non-throwing boolean checks. It is highly recommended to use these functions to evaluate conditions manually, especially when you need to handle failures gracefully (e.g., returning an `Attempt` or `Maybe` rather than throwing).

### Available Checks
*   **`isNull(subject)`**: Checks if strictly `null` or `undefined`.
*   **`isNotNull(subject)`**: Checks if neither `null` nor `undefined` (Acts as a Type Predicate).
*   **`isNullOrEmpty(subject)`**: Checks if `null`, `undefined`, or has a `length` of `0`.
*   **`isNotNullOrEmpty(subject)`**: Inverse of `isNullOrEmpty` (Acts as a Type Predicate).
*   **`isGreaterThan(subject, min)`**: Strict `>`.
*   **`isSmallerThan(subject, max)`**: Strict `<`.
*   **`isGreaterThanOrEquals(subject, min)`**: Inclusive `>=`.
*   **`isSmallerThanOrEquals(subject, max)`**: Inclusive `<=`.
*   **`isBetween(subject, limit1, limit2)`**: Strictly between two limits (exclusive). Automatically detects upper/lower bounds.
*   **`isBetweenInclusive(subject, limit1, limit2)`**: Between two limits (inclusive). Automatically detects upper/lower bounds.
*   **`equals(subject, other, comparer?)`**: Strict equality (`===`), optionally accepts a custom `EqualityComparer`.
*   **`notEquals(subject, other, comparer?)`**: Strict inequality (`!==`).
*   **`looseEquals(subject, other)`**: Loose equality (`==`).
*   **`looseNotEquals(subject, other)`**: Loose inequality (`!=`).

---

## 3. Assert Namespace (`Assert.ts`)

The `Assert` namespace provides throwing counterparts for all functions present in `Check`. Upon successful validation, these functions **return the original subject**, allowing for clean inline assignments.

Every function in the `Assert` namespace accepts an optional `message` (string or `Error` object) as its final parameter.

### Example Usage

```typescript
import { Assert } from "src/toolbox/Assertions/Assert";

// Throws if undefined/null, otherwise returns the non-nullable string
const name = Assert.isNotNull(payload.name, "Name cannot be null");

// Validates ranges and returns the subject
const age = Assert.isBetweenInclusive(payload.age, 18, 99, "Age must be between 18 and 99");
```
