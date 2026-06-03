import { Entry, ResourceManagerConfigurationOptions } from "./ResourceManager";

/**
 * The Configuration Builder
 * 1. Takes TSchema explicitly.
 * 2. Returns a function that infers the string literal keys from the object.
 */
function defineSchema<TSchema>() {
    return function inferNamespaces<
        TDefault extends string,
        TFallback extends string = never,
        TOthers extends string = never
    >(config: {
        default: Entry<TDefault, TSchema>;
        fallback?: Entry<TFallback, Partial<TSchema>>;
        others?: Record<TOthers, Partial<TSchema>>;
    }): ResourceManagerConfigurationOptions<TSchema, TDefault | TFallback | TOthers, TDefault, TFallback> {
        return config as any; 
    }
}

function defineResources<
    TSchema,
    TDefault extends string,
    TFallback extends string = never,
    TOthers extends string = never
>(config: {
    default: Entry<TDefault, TSchema>;
    fallback?: Entry<TFallback, Partial<TSchema>>;
    others?: Record<TOthers, Partial<TSchema>>;
}): ResourceManagerConfigurationOptions<TSchema, TDefault | TFallback | TOthers, TDefault, TFallback> {
    return config as any; 
}

export type Resources = never;

export const Resources = {
    define: defineResources,
    defineSchema,
}