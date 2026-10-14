import { LogLevel } from "../LogLevel";

/**
 * Defines a suite of ergonomic extension methods for logging string messages, 
 * inspired by `Microsoft.Extensions.Logging`. Implementations of this interface 
 * transparently map these calls down to the underlying `StateLogger`.
 */
export type MessageLogger = {
    /**
     * Logs a formatted message.
     * @param level - The severity level.
     * @param message - The message template containing placeholders (e.g., `{UserName}`).
     * @param args - A named object mapping properties to the placeholders.
     */
    log(level: LogLevel, message: string, args?: Record<string, any>): void;
    
    /**
     * Logs a formatted message.
     * @param level - The severity level.
     * @param message - The message template containing placeholders (e.g., `{0}` or `{UserName}`).
     * @param args - Positional arguments resolved left-to-right.
     */
    log(level: LogLevel, message: string, ...args: any[]): void;

    /** Logs a trace-level message. */
    logTrace(message: string, args?: Record<string, any>): void;
    /** Logs a trace-level message. */
    logTrace(message: string, ...args: any[]): void;

    /** Logs a debug-level message. */
    logDebug(message: string, args?: Record<string, any>): void;
    /** Logs a debug-level message. */
    logDebug(message: string, ...args: any[]): void;

    /** Logs an info-level message. */
    logInfo(message: string, args?: Record<string, any>): void;
    /** Logs an info-level message. */
    logInfo(message: string, ...args: any[]): void;

    /** Logs a warning-level message. */
    logWarning(message: string, args?: Record<string, any>): void;
    /** Logs a warning-level message. */
    logWarning(message: string, ...args: any[]): void;

    /** Logs an error-level message. */
    logError(message: string, args?: Record<string, any>): void;
    /** Logs an error-level message. */
    logError(message: string, ...args: any[]): void;
    /** Logs an error-level message alongside an Exception/Error instance. */
    logError(error: Error, message: string, args?: Record<string, any>): void;
    /** Logs an error-level message alongside an Exception/Error instance. */
    logError(error: Error, message: string, ...args: any[]): void;

    /** Logs a fatal-level message. */
    logFatal(message: string, args?: Record<string, any>): void;
    /** Logs a fatal-level message. */
    logFatal(message: string, ...args: any[]): void;
    /** Logs a fatal-level message alongside an Exception/Error instance. */
    logFatal(error: Error, message: string, args?: Record<string, any>): void;
    /** Logs a fatal-level message alongside an Exception/Error instance. */
    logFatal(error: Error, message: string, ...args: any[]): void;
}
