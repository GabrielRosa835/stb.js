import { StateLogger } from "../abstractions/StateLogger";
import { LogLevel } from "../LogLevel";
import { MessageFormatter } from "../messages/MessageFormatter";

/**
 * A basic implementation of StateLogger that outputs formatted logs 
 * directly to the system console (`console.info`, `console.error`, etc.).
 * @template Category - A literal type indicating the component or module category.
 */
export class ConsoleLogger<Category extends string> implements StateLogger<Category> {

    /**
     * Initializes a new instance of ConsoleLogger.
     * @param category - The logging category (typically a class or module name).
     * @param minLevel - The threshold level below which logs are ignored.
     */
    public constructor(
        public readonly category: Category,
        private readonly minLevel: LogLevel = LogLevel.Trace
    ) {}

    /**
     * Begins a logical operation scope. (No-op in this simple console implementation).
     * @param _state - The scope context.
     * @returns A callback to end the scope.
     */
    beginScope<State>(_state: State): StateLogger.EndScope {
        return () => {};
    }

    /**
     * Evaluates whether a given level meets the configured minimum threshold.
     * @param logLevel - The level to check.
     * @returns `true` if it meets or exceeds the threshold.
     */
    isEnabled(logLevel: LogLevel): boolean {
        return LogLevel.compare(logLevel, this.minLevel) >= 0;
    }

    /**
     * Helper to format the current time as `HH:mm:ss.SSS`.
     * @returns The exact current timestamp.
     */
    private getTimestamp(): string {
        const now = new Date();
        const hh = now.getHours().toString().padStart(2, '0');
        const mm = now.getMinutes().toString().padStart(2, '0');
        const ss = now.getSeconds().toString().padStart(2, '0');
        const ms = now.getMilliseconds().toString().padStart(3, '0');
        return `${hh}:${mm}:${ss}.${ms}`;
    }

    /**
     * Logs the state to the console using the standard environment log streams.
     * @param logLevel - Severity level of the log.
     * @param state - The payload to be formatted.
     * @param error - Optional error.
     * @param formatter - Formatter function to resolve the state into a printable string.
     */
    log<State>(logLevel: LogLevel, state: State, error: Error | null, formatter: MessageFormatter<State>): void {
        if (!this.isEnabled(logLevel)) {
            return;
        }

        const message = formatter(state, error);
        
        // Includes the timestamp in the prefix
        const prefix = `[${this.getTimestamp()}][${LogLevel.display(logLevel)}][${this.category}]`;

        switch (logLevel) {
            case LogLevel.Trace:
            case LogLevel.Debug:
                console.debug(`${prefix} ${message}`);
                break;
            case LogLevel.Info:
                console.info(`${prefix} ${message}`);
                break;
            case LogLevel.Warning:
                console.warn(`${prefix} ${message}`);
                break;
            case LogLevel.Error:
            case LogLevel.Fatal:
                console.error(`${prefix} ${message}`);
                break;
        }
    }
}
