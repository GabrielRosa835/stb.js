import { LogLevel } from "./../LogLevel";
import { StateLogger } from "../abstractions/StateLogger";
import { MessageFormatter } from "../messages/MessageFormatter";

/**
 * An aggregate logger that delegates logging operations to multiple underlying StateLoggers.
 * This is primarily used by the LoggerFactory to broadcast log calls to all registered providers.
 * 
 * @template Category - A literal type indicating the component or module category.
 */
export class GroupLogger<Category extends string> implements StateLogger<Category> {

    /**
     * Initializes a new instance of GroupLogger.
     * @param category - The logging category associated with these loggers.
     * @param loggers - An array of configured StateLoggers to proxy calls to.
     */
    public constructor (
        public readonly category: Category,
        public readonly loggers: StateLogger<Category>[]
    ) { }

    /**
     * Begins a logical operation scope across all registered loggers.
     * @param state - The scope context.
     * @returns A composite callback that ends the scope on all internal loggers.
     */
    beginScope<State>(state: State): StateLogger.EndScope {
        const scopes = this.loggers.map(l => l.beginScope(state));
        return () => scopes.forEach(endScope => endScope());
    }

    /**
     * Dispatches the log payload to every internal logger that has the given log level enabled.
     * @param logLevel - The severity of the log entry.
     * @param state - The state data or payload to log.
     * @param error - An optional error associated with this log.
     * @param formatter - The formatting function to resolve the state into a string.
     */
    log<State>(logLevel: LogLevel, state: State, error: Error | null, formatter: MessageFormatter<State>): void {
        for (const logger of this.loggers) {
            if (logger.isEnabled(logLevel)) {
                const scope = logger.beginScope(state);
                logger.log(logLevel, state, error, formatter);
                scope();
            }
        }
    }

    /**
     * Checks if the given log level is enabled for all registered loggers.
     * @param logLevel - The log level to check.
     * @returns `true` if every internal logger has this level enabled, otherwise `false`.
     */
    isEnabled(logLevel: LogLevel): boolean {
        return this.loggers.every(l => l.isEnabled(logLevel));
    }

}
