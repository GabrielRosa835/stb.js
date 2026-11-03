import { NonEmptyArray } from "../../common/NonEmptyArray";
import { Logger } from "./Logger";
import { LoggerProvider } from "./LoggerProvider";
import { GroupLogger } from "../loggers/GroupLogger";
import { ExtendedLogger } from "../loggers/ExtendedLogger";

/**
 * Defines a factory capable of producing a unified `Logger` given a category name 
 * and a list of underlying logger providers.
 */
export type LoggerFactory = <Category extends string>(categoryName: Category, providers: NonEmptyArray<LoggerProvider>) => Logger<Category>;

/**
 * Provides the default implementation for the LoggerFactory.
 */
export namespace LoggerFactory {
    /**
     * The default LoggerFactory logic. It groups the resulting provider instances 
     * and automatically wraps them in an ExtendedLogger, thereby adding the full 
     * MessageLogger capability set to any core StateLogger.
     * 
     * @param categoryName - The name of the category to associate with the created loggers.
     * @param providers - An array of one or more LoggerProviders to initialize.
     * @returns A unified `Logger` instance.
     */
    export const Default: LoggerFactory = <Category extends string>(categoryName: Category, providers: NonEmptyArray<LoggerProvider>): Logger<Category> => {
        const loggers = providers.map(provider => provider(categoryName));
        const groupLogger = new GroupLogger(categoryName, loggers);
        return new ExtendedLogger(groupLogger);
    };
}
