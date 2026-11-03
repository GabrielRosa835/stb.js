import { Logger } from "./abstractions/Logger";
import { NoOpLogger } from "./loggers/NoOpLogger";
import { LogLevel } from "./LogLevel";

/**
 * A static global facade for the logging system.
 * By default, this is initialized to a `NoOpLogger` meaning no output is generated. 
 * Assign a fully configured `Logger` from `LoggerFactory.Default` to `Log.logger` 
 * to wire the entire application to your providers.
 */
export namespace Log {

    /** 
     * The global logger instance used by all static methods in this namespace. 
     */
    export let logger: Logger<any> = new NoOpLogger("Global");

    /** Logs a formatted message using an explicit log level. */
    export function message(level: LogLevel, message: string, args?: Record<string, any>): void;
    /** Logs a formatted message using an explicit log level. */
    export function message(level: LogLevel, message: string, ...args: any[]): void;
    export function message(level: LogLevel, message: string, ...args: unknown[]): void {
        (logger.log as any)(level, message, ...args);
    }

    /** Logs a trace-level message. */
    export function trace(message: string, args?: Record<string, any>): void;
    /** Logs a trace-level message. */
    export function trace(message: string, ...args: any[]): void;
    export function trace(message: string, ...args: unknown[]): void {
        (logger.logTrace as any)(message, ...args);
    }

    /** Logs a debug-level message. */
    export function debug(message: string, args?: Record<string, any>): void;
    /** Logs a debug-level message. */
    export function debug(message: string, ...args: any[]): void;
    export function debug(message: string, ...args: unknown[]): void {
        (logger.logDebug as any)(message, ...args);
    }

    /** Logs an info-level message. */
    export function info(message: string, args?: Record<string, any>): void;
    /** Logs an info-level message. */
    export function info(message: string, ...args: any[]): void;
    export function info(message: string, ...args: unknown[]): void {
        (logger.logInfo as any)(message, ...args);
    }

    /** Logs a warning-level message. */
    export function warning(message: string, args?: Record<string, any>): void;
    /** Logs a warning-level message. */
    export function warning(message: string, ...args: any[]): void;
    export function warning(message: string, ...args: unknown[]): void {
        (logger.logWarning as any)(message, ...args);
    }

    /** Logs an error-level message. */
    export function error(message: string, args?: Record<string, any>): void;
    /** Logs an error-level message. */
    export function error(message: string, ...args: any[]): void;
    /** Logs an error-level message alongside an Exception/Error instance. */
    export function error(error: Error, message: string, args?: Record<string, any>): void;
    /** Logs an error-level message alongside an Exception/Error instance. */
    export function error(error: Error, message: string, ...args: any[]): void;
    export function error(...args: unknown[]): void {
        (logger.logError as any)(...args);
    }

    /** Logs a fatal-level message. */
    export function fatal(message: string, args?: Record<string, any>): void;
    /** Logs a fatal-level message. */
    export function fatal(message: string, ...args: any[]): void;
    /** Logs a fatal-level message alongside an Exception/Error instance. */
    export function fatal(error: Error, message: string, args?: Record<string, any>): void;
    /** Logs a fatal-level message alongside an Exception/Error instance. */
    export function fatal(error: Error, message: string, ...args: any[]): void;
    export function fatal(...args: unknown[]): void {
        (logger.logFatal as any)(...args);
    }
}
