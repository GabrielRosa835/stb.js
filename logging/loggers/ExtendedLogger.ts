import { Logger } from "../abstractions/Logger";
import { LogMessage } from "../messages/LogMessage";
import { LogLevel } from "./../LogLevel";
import { StateLogger } from "../abstractions/StateLogger";
import { MessageFormatter } from "../messages/MessageFormatter";

/**
 * A wrapper class that elevates any `StateLogger` to the full `Logger` interface.
 * It provides the translation logic necessary to convert ergonomic message extension 
 * method calls (e.g. `logInfo`, `logError`) into structured `LogMessage` payloads 
 * delivered to the underlying core state provider.
 * 
 * @template Category - A literal type indicating the component or module category.
 */
export class ExtendedLogger<Category extends string> implements Logger<Category> {

    /**
     * Initializes a new instance of ExtendedLogger.
     * @param core - The underlying `StateLogger` instance responsible for the actual output.
     */
    public constructor (private readonly core: StateLogger<Category>) { }

    /** Gets the underlying logger's category. */
    get category(): Category { return this.core.category; }

    /** Proxies the scope creation to the underlying logger. */
    beginScope<State>(state: State): StateLogger.EndScope { return this.core.beginScope(state); }

    /** Proxies the level-check to the underlying logger. */
    isEnabled(logLevel: LogLevel): boolean { return this.core.isEnabled(logLevel); }

    /** Core logging method handling both explicit state structures and standard message strings. */
    log<State>(logLevel: LogLevel, state: State, error: Error | null, formatter: MessageFormatter<State>): void;
    /** Logs a formatted message. */
    log(level: LogLevel, message: string, args?: Record<string, any>): void;
    /** Logs a formatted message. */
    log(level: LogLevel, message: string, ...args: any[]): void;
    log(level: LogLevel, stateOrMessage: unknown, ...args: unknown[]): void {
        if (typeof stateOrMessage === 'string') {
            this.logMessage(level, { message: stateOrMessage, arguments: this.parseArgs(args) }, null);
        } else {
            const error = args[0] instanceof Error ? args[0] : null;
            const formatter = args[1] ? args[1] as MessageFormatter<unknown> : MessageFormatter.Generic;
            this.core.log(level, stateOrMessage as any, error, formatter);
        }
    }

    /** Helper to funnel plain string-messages into a LogMessage state struct handled by the core logger. */
    private logMessage(level: LogLevel, message: LogMessage, error: Error | null) {
        if (this.core.isEnabled(level)) {
            const endScope = this.core.beginScope(message);
            this.core.log(level, message, error, MessageFormatter.Default);
            endScope();
        }
    }

    /** Extracts standard arguments from the generic Rest parameter list for MessageFormatter interpolation. */
    private parseArgs(args: unknown[]): Record<string, unknown> | unknown[] | undefined {
        if (args.length === 0) return undefined;
        if (args.length === 1 && typeof args[0] === 'object' && args[0] !== null && !Array.isArray(args[0])) {
            return args[0] as Record<string, unknown>;
        }
        return args;
    }

    /** Logs a trace-level message. */
    logTrace(message: string, args?: Record<string, any>): void;
    /** Logs a trace-level message. */
    logTrace(message: string, ...args: any[]): void;
    logTrace(message: string, ...args: unknown[]): void {
        this.logMessage("trace", { message, arguments: this.parseArgs(args) }, null);
    }

    /** Logs a debug-level message. */
    logDebug(message: string, args?: Record<string, any>): void;
    /** Logs a debug-level message. */
    logDebug(message: string, ...args: any[]): void;
    logDebug(message: string, ...args: unknown[]): void {
        this.logMessage("debug", { message, arguments: this.parseArgs(args) }, null);
    }

    /** Logs an info-level message. */
    logInfo(message: string, args?: Record<string, any>): void;
    /** Logs an info-level message. */
    logInfo(message: string, ...args: any[]): void;
    logInfo(message: string, ...args: unknown[]): void {
        this.logMessage("info", { message, arguments: this.parseArgs(args) }, null);
    }

    /** Logs a warning-level message. */
    logWarning(message: string, args?: Record<string, any>): void;
    /** Logs a warning-level message. */
    logWarning(message: string, ...args: any[]): void;
    logWarning(message: string, ...args: unknown[]): void {
        this.logMessage("warning", { message, arguments: this.parseArgs(args) }, null);
    }

    /** Logs an error-level message. */
    logError(message: string, args?: Record<string, any>): void;
    /** Logs an error-level message. */
    logError(message: string, ...args: any[]): void;
    /** Logs an error-level message alongside an Exception/Error instance. */
    logError(error: Error, message: string, args?: Record<string, any>): void;
    /** Logs an error-level message alongside an Exception/Error instance. */
    logError(error: Error, message: string, ...args: any[]): void;
    logError(...args: unknown[]): void {
        if (args[0] instanceof Error) {
            const [error, message, ...rest] = args as [Error, string, ...unknown[]];
            this.logMessage("error", { message, arguments: this.parseArgs(rest) }, error);
        } else {
            const [message, ...rest] = args as [string, ...unknown[]];
            this.logMessage("error", { message, arguments: this.parseArgs(rest) }, null);
        }
    }

    /** Logs a fatal-level message. */
    logFatal(message: string, args?: Record<string, any>): void;
    /** Logs a fatal-level message. */
    logFatal(message: string, ...args: any[]): void;
    /** Logs a fatal-level message alongside an Exception/Error instance. */
    logFatal(error: Error, message: string, args?: Record<string, any>): void;
    /** Logs a fatal-level message alongside an Exception/Error instance. */
    logFatal(error: Error, message: string, ...args: any[]): void;
    logFatal(...args: unknown[]): void {
        if (args[0] instanceof Error) {
            const [error, message, ...rest] = args as [Error, string, ...unknown[]];
            this.logMessage("fatal", { message, arguments: this.parseArgs(rest) }, error);
        } else {
            const [message, ...rest] = args as [string, ...unknown[]];
            this.logMessage("fatal", { message, arguments: this.parseArgs(rest) }, null);
        }
    }
}
