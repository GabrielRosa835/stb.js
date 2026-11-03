import { Logger } from "../abstractions/Logger";
import { LogLevel } from "./../LogLevel";
import { StateLogger } from "../abstractions/StateLogger";
import { MessageFormatter } from "../messages/MessageFormatter";

/**
 * A silent, empty implementation of the `Logger` interface.
 * It is used as the default placeholder for the global `Log` facade to safely 
 * prevent null-reference errors prior to proper application initialization.
 * 
 * @template Category - A literal type indicating the component or module category.
 */
export class NoOpLogger<Category extends string> implements Logger<Category> {
    
    /**
     * Initializes a new instance of NoOpLogger.
     * @param category - The logging category (typically ignored since this logs nothing).
     */
    public constructor (public readonly category: Category) { }

    /**
     * Returns an empty, do-nothing scope closure.
     */
    beginScope<State>(_state: State): StateLogger.EndScope { return () => { }; }

    /**
     * Always returns false to instantly reject any logging attempt.
     */
    isEnabled(_logLevel: LogLevel): boolean { return false; }

    log<State>(logLevel: LogLevel, state: State, error: Error | null, formatter: MessageFormatter<State>): void;
    log(level: LogLevel, message: string, args?: Record<string, any>): void;
    log(level: LogLevel, message: string, ...args: any[]): void;
    log(_level: LogLevel, _stateOrMessage: unknown, ..._args: unknown[]): void { }

    logTrace(_message: string, ..._args: unknown[]): void { }
    logDebug(_message: string, ..._args: unknown[]): void { }
    logInfo(_message: string, ..._args: unknown[]): void { }
    logWarning(_message: string, ..._args: unknown[]): void { }
    logError(..._args: unknown[]): void { }
    logFatal(..._args: unknown[]): void { }
}
