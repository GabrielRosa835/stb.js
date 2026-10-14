import { StateLogger } from "../abstractions/StateLogger";
import { MessageLogger } from "../messages/MessageLogger";

/**
 * The unified Logger interface exposed to application consumers.
 * It combines the core StateLogger implementation with the ergonomic extension methods 
 * from MessageLogger (e.g., `logInfo`, `logError`).
 * @template Category - A literal type indicating the component or module category.
 */
export type Logger<Category extends string> = StateLogger<Category> & MessageLogger;
