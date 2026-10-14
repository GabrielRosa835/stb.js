import { LoggerProvider } from "../abstractions/LoggerProvider";
import { LogLevel } from "../LogLevel";
import { ConsoleLogger } from "./ConsoleLoggerProvider";

/**
 * A central namespace containing built-in LoggerProvider factories.
 */
export namespace LogTo {
    /**
     * Creates a standard LoggerProvider that outputs logs to the browser or Node console.
     * @param minLevel - The minimum severity level required for a message to be logged (defaults to `trace`).
     * @returns A factory function that constructs `ConsoleLogger` instances per category.
     */
    export function Console(minLevel: LogLevel = LogLevel.Trace): LoggerProvider {
        return <Category extends string>(categoryName: Category) => new ConsoleLogger(categoryName, minLevel);
    }
}