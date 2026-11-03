import { StateLogger } from "./StateLogger";

/**
 * A factory function type responsible for instantiating a StateLogger for a specific category.
 * Used internally by the LoggerFactory to construct loggers.
 */
export type LoggerProvider = <Category extends string>(categoryName: Category) => StateLogger<Category>;
