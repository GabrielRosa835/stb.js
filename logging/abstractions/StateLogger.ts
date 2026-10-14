import { LogLevel } from "../LogLevel";
import { MessageFormatter } from "../messages/MessageFormatter";

/**
 * Namespace containing utility types for StateLogger.
 */
export namespace StateLogger {
    /**
     * A callback function to end the scope initialized by a logger.
     */
    export type EndScope = () => void;
}

/**
 * Defines the core contract that custom logging providers must implement.
 * This interface works directly with raw state and formatters rather than plain strings.
 * @template Category - A literal type indicating the component or module category.
 */
export type StateLogger<Category extends string> = {
    /** The category name associated with this logger. */
    readonly category: Category;
    
    /**
     * Begins a logical operation scope.
     * @param state - The state associated with the scope.
     * @returns A callback to end the scope.
     */
    beginScope<State>(state: State): StateLogger.EndScope;

    /**
     * Logs a raw state object using the provided LogLevel and MessageFormatter.
     * @param logLevel - The severity of the log entry.
     * @param state - The state data or payload to log.
     * @param error - An optional error associated with this log.
     * @param formatter - The formatting function to resolve the state into a string.
     */
    log<State>(logLevel: LogLevel, state: State, error: Error | null, formatter: MessageFormatter<State>): void;

    /**
     * Checks if a given log level is enabled for this logger.
     * @param logLevel - The log level to check.
     * @returns `true` if enabled, otherwise `false`.
     */
    isEnabled(logLevel: LogLevel): boolean;
}