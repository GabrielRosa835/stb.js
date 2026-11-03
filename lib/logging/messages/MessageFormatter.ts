import { LogMessage } from "./LogMessage";

/**
 * A callback function responsible for taking a payload state and optionally 
 * an Error, and formatting it into a final readable string.
 */
export type MessageFormatter<State> = (state: State, error: Error | null) => string;

/**
 * Contains standard built-in message formatters.
 */
export namespace MessageFormatter {

    /**
     * A formatter inspired by the semantics of `Microsoft.Extensions.Logging`.
     * It correctly resolves positional arrays (left-to-right replacement) and 
     * named objects (by key lookup, stripping .NET alignment/formatting options).
     * Supports double-brace escaping (e.g. `{{` outputs `{`).
     * 
     * @param state - The LogMessage containing the template and arguments.
     * @param error - An optional error to append to the end of the message.
     * @returns The fully interpolated log string.
     */
    export function Default(state: LogMessage, error: Error | null): string {
        const parameters = state.arguments;
        let arrayIndex = 0;

        // Match {{ for escaped {, }} for escaped }, and {key} for parameters.
        const tokenRegex = /{{|}}|{([^}]+)}/g;

        const message = state.message.replace(tokenRegex, (match, key) => {
            if (match === '{{') return '{';
            if (match === '}}') return '}';

            let value: any;

            if (Array.isArray(parameters)) {
                // Positional behavior (Array input)
                if (arrayIndex >= parameters.length) {
                    return match; // Fallback to original token if out of bounds
                }
                value = parameters[arrayIndex++];
            } else if (parameters && typeof parameters === 'object') {
                // Named behavior (Object input)
                const name = key.split(/[:,]/)[0].trim();
                value = (parameters as Record<string, any>)[name];
            } else {
                return match;
            }

            if (value === undefined) {
                return match;
            }

            if (value === null) {
                return "null";
            }

            return typeof value === 'object' ? JSON.stringify(value) : String(value);
        });

        return error ? `${message}\n${error.stack ?? error.message}` : message;
    }

    /**
     * A generic fallback formatter that simply JSON.stringifies objects.
     * 
     * @param state - The arbitrary state object.
     * @param error - An optional error. If provided, the state is ignored and the error is printed.
     * @returns A simple serialized string representation.
     */
    export function Generic<State>(state: State, error: Error | null): string {
        if (error) {
            return JSON.stringify(error);
        }
        return typeof state === 'object' ? JSON.stringify(state) : String(state);
    }
}
