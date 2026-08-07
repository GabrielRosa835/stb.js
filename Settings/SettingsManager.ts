/**
 * Sources the value only at the first request, caching it for subsequent ones.
 * @template TSettings The type of the settings object.
 */
export type SettingsSnapshot<TSettings> = {
    /**
     * The fetched settings.
     */
    readonly value: TSettings;
}

/**
 * Sources the value only at the first request asynchronously, caching it for subsequent ones.
 * @template TSettings The type of the settings object.
 */
export type AsyncSettingsSnapshot<TSettings> = {
    /**
     * The promised fetched settings.
     */
    readonly value: Promise<TSettings>;
}

/**
 * Sources the value at every request, guaranteeing a fresh one every time.
 * @template TSettings The type of the settings object.
 */
export type SettingsProvider<TSettings> = {
    /**
     * The freshly fetched settings.
     */
    readonly value: TSettings;
    /**
     * Allows retrieving values with a custom name indexer.
     * @param name - The specific name or section to retrieve.
     */
    readonly getValue: (name: string) => TSettings;
}

/**
 * Sources the value at every request asynchronously, guaranteeing a fresh one every time.
 * @template TSettings The type of the settings object.
 */
export type AsyncSettingsProvider<TSettings> = {
    /**
     * The freshly fetched settings.
     */
    readonly value: Promise<TSettings>;
    /**
     * Allows retrieving values with a custom name indexer asynchronously.
     * @param name - The specific name or section to retrieve.
     */
    readonly getValue: (name: string) => Promise<TSettings>;
}

/**
 * Attaches a string discriminator to the settings type and allows identifying it 
 * strongly from within the manager.
 * @template TSettings The type of the settings object bound to this key.
 */
export type SettingsKey<TSettings> = string & { __type: TSettings };

export const SettingsKey = {
    /**
     * Creates a strongly-typed settings key.
     * @param value - The unique string identifier for the setting.
     * @returns A strongly-typed SettingsKey.
     */
    for: <TSettings>(value: string): SettingsKey<TSettings> => value as SettingsKey<TSettings>,
}

/**
 * Responsible for fetching the settings synchronously.
 * 
 * Allows specifying a simple validator that's expected to throw on errors.
 * @template TSettings The type of the settings object.
 */
export type SettingsSource<TSettings> = {
    /**
     * Loads the settings synchronously.
     * @param name - An optional name or section identifier.
     */
    load: (name?: string) => TSettings;
    /**
     * Validates the loaded settings. Should throw an error if invalid.
     */
    validator?: (settings: TSettings) => void;
}

/**
 * Responsible for fetching the settings asynchronously.
 * Allows specifying a simple validator that's expected to throw on errors.
 * @template TSettings The type of the settings object.
 */
export type AsyncSettingsSource<TSettings> = {
    /**
     * Loads the settings asynchronously.
     * @param name - An optional name or section identifier.
     */
    load: (name?: string) => Promise<TSettings>;
    /**
     * Validates the loaded settings. Should throw an error if invalid.
     */
    validator?: (settings: TSettings) => void;
}

/**
 * Strongly typed provider and snapshot source for synchronous settings.
 * @template TSettings The type of the settings object.
 */
export type SettingsConsumer<TSettings> = {
    /** Gets the cached value or sources it if none was already requested. */
    readonly value: TSettings;
    /** Gets a factory for fresh settings on every call. */
    provider: () => SettingsProvider<TSettings>;
    /** Gets a factory for cached settings. */
    snapshot: () => SettingsSnapshot<TSettings>;
}

/**
 * Strongly typed provider and snapshot source for asynchronous settings.
 * @template TSettings The type of the settings object.
 */
export type AsyncSettingsConsumer<TSettings> = {
    /** Gets the cached value or asynchornously sources it if none was already requested. */
    readonly value: Promise<TSettings>;
    /** Gets a factory for fresh asynchronous settings on every call. */
    provider: () => AsyncSettingsProvider<TSettings>;
    /** Gets a factory for cached asynchronous settings. */
    snapshot: () => AsyncSettingsSnapshot<TSettings>;
}

/**
 * The singleton manager responsible for registering and resolving settings.
 */
export type SettingsManager = {
    /** Registers a synchronous settings source. */
    register: <TSettings>(key: SettingsKey<TSettings> | string, source: SettingsSource<TSettings>) => SettingsConsumer<TSettings>;
    /** Registers an asynchronous settings source. */
    asyncRegister: <TSettings>(key: SettingsKey<TSettings> | string, source: AsyncSettingsSource<TSettings>) => AsyncSettingsConsumer<TSettings>;
    /** Forces the load and caching of a specific setting, bypassing lazy evaluation. */
    forceLoad: <TSettings>(key: SettingsKey<TSettings> | string) => Promise<TSettings>;
    /** Retrieves a cached synchronous setting value. Throws if not loaded. */
    value: <TSettings>(key: SettingsKey<TSettings> | string) => TSettings;
    /** Retrieves a cached asynchronous setting value, or triggers the load if not cached. */
    asyncValue: <TSettings>(key: SettingsKey<TSettings> | string) => Promise<TSettings>;
    /** Retrieves a synchronous provider for the given key. */
    provider: <TSettings>(key: SettingsKey<TSettings> | string) => SettingsProvider<TSettings>;
    /** Retrieves an asynchronous provider for the given key. */
    asyncProvider: <TSettings>(key: SettingsKey<TSettings> | string) => AsyncSettingsProvider<TSettings>;
    /** Retrieves a synchronous snapshot for the given key. */
    snapshot: <TSettings>(key: SettingsKey<TSettings> | string) => SettingsSnapshot<TSettings>;
    /** Retrieves an asynchronous snapshot for the given key. */
    asyncSnapshot: <TSettings>(key: SettingsKey<TSettings> | string) => AsyncSettingsSnapshot<TSettings>;
}

type SettingsCache<TSettings> = {
    value: TSettings, 
    loaded: boolean, 
    promise: Promise<TSettings> | undefined,
}

export const SettingsManager = {
    /**
     * Creates a new instance of the SettingsManager.
     * @returns A fully initialized SettingsManager.
     */
    create(): SettingsManager {

        const _syncSources: Record<SettingsKey<any> | string, SettingsSource<any>> = {};
        const _asyncSources: Record<SettingsKey<any> | string, AsyncSettingsSource<any>> = {};
        const _cache: Record<SettingsKey<any> | string, SettingsCache<any>> = {};

        function value<TSettings>(key: SettingsKey<TSettings> | string): TSettings {

            const cache = _cache[key];
            if (cache === undefined) {
                throw new Error(`No settings was registered for key '${key}'`);
            }
            if (cache.loaded) return cache.value;
            
            const source = _syncSources[key];
            if (source === undefined) {
                throw new Error(`No synchronous source was configured for settings with key '${key}'`);
            }

            const value = source.load();
            if (source.validator !== undefined) {
                source.validator(value);
            }
            cache.value = value;
            cache.loaded = true;

            return cache.value;
        }

        async function asyncValue<TSettings>(key: SettingsKey<TSettings> | string): Promise<TSettings> {

            const cache = _cache[key];
            if (cache === undefined) {
                throw new Error(`No settings was registered for key '${key}'`);
            }
            if (cache.loaded) return Promise.resolve(cache.value);

            const source = _asyncSources[key];
            if (source === undefined) {
                throw new Error(`No asynchronous source was configured for settings with key '${key}'`);
            }

            if (cache.promise !== undefined) return cache.promise;

            cache.promise = source.load();
            const value = await cache.promise;
            if (source.validator !== undefined) {
                source.validator(value);
            }
            cache.value = value;
            cache.loaded = true;

            return cache.value;
        }

        function provider<TSettings>(key: SettingsKey<TSettings> | string): SettingsProvider<TSettings> {
            const _source = _syncSources[key];
            if (_source === undefined) {
                throw new Error(`No synchronous source was configured for settings with key '${key}'`);
            }
            function valueGetter(name?: string): TSettings {
                const value = _source.load(name);
                if (_source.validator !== undefined) {
                    _source.validator(value);
                }
                return value;
            }
            return {
                get value() {
                    return valueGetter();
                },
                getValue(name: string) {
                    return valueGetter(name);
                }
            }
        }

        function snapshot<TSettings>(key: SettingsKey<TSettings> | string): SettingsSnapshot<TSettings> {
            const _source = _syncSources[key];
            if (_source === undefined) {
                throw new Error(`No synchronous source was configured for settings with key '${key}'`);
            }

            let _loaded: boolean = false;
            let _value: TSettings = undefined!;

            return {
                get value() {

                    if (_loaded) return _value;

                    _value = _source.load();
                    if (_source.validator !== undefined) {
                        _source.validator(_value);
                    }

                    _loaded = true;
                    return _value;
                }
            }
        }

        function register<TSettings>(key: SettingsKey<TSettings> | string, source: SettingsSource<TSettings>): SettingsConsumer<TSettings> {
            if (_syncSources[key] !== undefined || _asyncSources[key] !== undefined) {
                console.warn(`Settings for key '${key}' is being overwritten.`);
            }
            _syncSources[key] = source;
            _cache[key] = { value: undefined, loaded: false, promise: undefined };
            return {
                get value() {
                    return value<TSettings>(key);
                },
                provider: () => provider<TSettings>(key),
                snapshot: () => snapshot<TSettings>(key),
            }
        }

        function asyncProvider<TSettings>(key: SettingsKey<TSettings> | string): AsyncSettingsProvider<TSettings> {
            const _source = _asyncSources[key];
            if (_source === undefined) {
                throw new Error(`No asynchronous source was configured for settings with key '${key}'`);
            }
            async function valueGetter(name?: string): Promise<TSettings> {
                const value = await _source.load(name);
                if (_source.validator !== undefined) {
                    _source.validator(value);
                }
                return value;
            }
            return {
                get value() {
                    return valueGetter();
                },
                getValue(name: string) {
                    return valueGetter(name);
                }
            }
        }
        function asyncSnapshot<TSettings>(key: SettingsKey<TSettings> | string): AsyncSettingsSnapshot<TSettings> {
            const _source = _asyncSources[key];
            if (_source === undefined) {
                throw new Error(`No asynchronous source was configured for settings with key '${key}'`);
            }

            let _promise: Promise<TSettings> = undefined!;
            let _loaded: boolean = false;
            let _value: TSettings = undefined!;

            async function valueGetter(): Promise<TSettings> {
                _value = await _source.load();
                if (_source.validator !== undefined) {
                    _source.validator(_value);
                }
                _loaded = true;
                return _value;
            }

            return {
                get value() {
                    if (_loaded) return Promise.resolve(_value);
                    if (_promise !== undefined) return _promise;
                    _promise = valueGetter();
                    return _promise;
                }
            }
        }

        function asyncRegister<TSettings>(key: SettingsKey<TSettings> | string, source: AsyncSettingsSource<TSettings>): AsyncSettingsConsumer<TSettings> {
            _asyncSources[key] = source;
            _cache[key] = { value: undefined, loaded: false, promise: undefined };
            if (_asyncSources[key]) {
                console.warn(`Settings for key '${key}' is being overwritten.`);
            }
            return {
                get value () {
                    return asyncValue<TSettings>(key);
                },
                provider: () => asyncProvider<TSettings>(key),
                snapshot: () => asyncSnapshot<TSettings>(key),
            }
        }

        async function forceLoad<TSettings>(key: SettingsKey<TSettings> | string): Promise<TSettings> {

            const cache = _cache[key];
            if (cache === undefined) {
                throw new Error(`No settings was registered for key '${key}'`);
            }

            const syncSource = _syncSources[key];
            if (syncSource !== undefined) {
                const value = syncSource.load();
                if (syncSource.validator !== undefined) {
                    syncSource.validator(value);
                }
                cache.value = value;
                cache.loaded = true;
                return cache.value;
            }

            const asyncSource = _asyncSources[key];
            if (asyncSource !== undefined) {
                cache.promise = cache.promise ?? asyncSource.load();
                const value = await cache.promise;
                if (asyncSource.validator !== undefined) {
                    asyncSource.validator(value);
                }
                cache.value = value;
                cache.loaded = true;
                return cache.value;
            }
            
            throw new Error(`No source was configured for settings with key '${key}'`);
        }

        return {
            register,
            asyncRegister,
            value,
            asyncValue,
            provider,
            asyncProvider,
            snapshot,
            asyncSnapshot,
            forceLoad,
        }
    }
}