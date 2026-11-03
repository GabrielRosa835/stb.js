/**
 * Flattens any record type into its corresponding fields/values recursively.
 */
export type Plain<T> = T extends Record<string, unknown> ? {
    [K in keyof T]: Plain<T[K]>;
} : T;

/**
 * Flattens any record type into its corresponding fields/values.
 */
export type Flat<T> = T extends Record<string, unknown> ? {
    [K in keyof T]: T[K];
} : T;
