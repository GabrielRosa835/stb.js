/**
 * Represents the severity level of a log message.
 */
export type LogLevel = "trace" | "debug" | "info" | "warning" | "error" | "fatal";

/**
 * Provides constants and utility functions for interacting with log levels.
 */
export namespace LogLevel {

    export const Trace = "trace" as const;
    export const Debug = "debug" as const;
    export const Info = "info" as const;
    export const Warning = "warning" as const;
    export const Error = "error" as const;
    export const Fatal = "fatal" as const;

    /**
     * Converts a LogLevel to a compact, 3-character display string (e.g. "INF", "ERR").
     * @param level - The log level to display.
     * @returns The compact string representation of the log level.
     */
    export function display(level: LogLevel) {
        switch (level) {
            case Trace:   return "TRC";
            case Debug:   return "DBG";
            case Info:    return "INF";
            case Warning: return "WAR";
            case Error:   return "ERR";
            case Fatal:   return "FTL";
            default:
                const _exhaustiveCheck: never = level;
                return _exhaustiveCheck;
        }
    }

    /**
     * Gets the numeric weight of a LogLevel for comparison purposes.
     * Higher numbers represent higher severities.
     * @param level - The log level.
     * @returns A numeric weight corresponding to the severity.
     */
    export function value(level: LogLevel): number {
        switch (level) {
            case LogLevel.Trace:   return 0;
            case LogLevel.Debug:   return 1;
            case LogLevel.Info:    return 2;
            case LogLevel.Warning: return 3;
            case LogLevel.Error:   return 4;
            case LogLevel.Fatal:   return 5;
            default:
                const _exhaustiveCheck: never = level;
                return _exhaustiveCheck;
        }
    }

    /**
     * Compares two LogLevels based on their numeric weight.
     * @param left - The first LogLevel to compare.
     * @param right - The second LogLevel to compare.
     * @returns A positive number if `left` is more severe, a negative number if `right` is more severe, or 0 if they are equal.
     */
    export function compare(left: LogLevel, right: LogLevel): number {
        return value(left) - value(right);
    }
}