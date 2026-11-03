/**
 * Represents a structured message state payload passed to StateLoggers.
 */
export type LogMessage = {
    /** The raw message template string containing placeholders. */
    message: string;
    /** The arguments provided to hydrate the message template, if any. */
    arguments?: Record<string, unknown> | unknown[];
};
