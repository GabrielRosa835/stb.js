import { AsyncSettingsSource } from "./SettingsManager";

/**
 * Options for configuring a static fetcher source.
 * @template TSettings The type of the expected settings object.
 */
export type StaticFetchSourceOptions<TSettings> = {
    /** The path or URL to the static JSON configuration file. */
    filePath: string;
    /** An optional validation function that throws if the loaded configuration is invalid. */
    validator?: (settings: TSettings) => void;
}

/**
 * An asynchronous source designed to fetch static configuration via the Fetch API.
 * @template TSettings The type of the settings object.
 */
export type StaticFetchSource<TSettings> = AsyncSettingsSource<TSettings>;

export const StaticFetchSource = {
    /**
     * Creates a new StaticFetchSource.  
     * @param options - Configuration options for the fetch source.
     * @returns An initialized asynchronous settings source.
     */
    create<TSettings>(options: StaticFetchSourceOptions<TSettings>): StaticFetchSource<TSettings> {

        const _options = options;
        let _fixedFilePath: string | null = null;

        async function load(): Promise<TSettings> {
            try {
                const response = await fetch(_fixedFilePath ?? _options.filePath, {
                    cache: 'no-store' // Prevents the browser from serving a stale config
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const settings = await response.json();
                if (!settings) {
                    throw new Error("Initialization Error: Response returned with an empty body.");
                }
                if (!_fixedFilePath) {
                    _fixedFilePath = new URL(_options.filePath, window.location.origin).href;
                }
                return settings;
            } catch (error) {
                console.error('Failed to load configuration at: ', _fixedFilePath ?? _options.filePath);
                throw error;
            }
        }

        return {
            load,
            validator: _options.validator,
        }
    }
}