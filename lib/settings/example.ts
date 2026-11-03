import { SettingsKey, SettingsManager } from "./SettingsManager";
import { StaticFetchSource } from "./StaticFetchSource";

export type AppSettings = {
    apiUrl: string;
    routerBase: string;
    useEntraId: boolean;
    entraId?: {
        clientId: string;
        authority: string;
        redirectUri: string;
        scopes: string[];
    };
    mockUsername?: string;
    logDebug: boolean;
}

export const AppSettings = {
    key: SettingsKey.for<AppSettings>("app-settings")
}

function validateSettings(settings: AppSettings) {
    if (!settings.apiUrl || !URL.canParse(settings.apiUrl)) {
        throw new Error("Configuration Error: 'apiUrl' is missing or is not a valid URL.");
    }
    if (!settings.routerBase) {
        throw new Error("Configuration Error: 'routerBase' cannot be empty.");
    }
    if (settings.useEntraId) {
        if (!settings.entraId) {
            throw new Error("Configuration Error: 'entraId' object is required when 'useEntraId' is enabled.");
        }
        if (!settings.entraId.clientId) {
            throw new Error("Configuration Error: 'entraId.clientId' cannot be empty.");
        }
        if (!settings.entraId.authority || !URL.canParse(settings.entraId.authority)) {
            throw new Error("Configuration Error: 'entraId.authority' is missing or is not a valid URL.");
        }
        if (!settings.entraId.redirectUri || !URL.canParse(settings.entraId.redirectUri)) {
             throw new Error("Configuration Error: 'entraId.redirectUri' is missing or is not a valid URL.");
        }
        if (!settings.entraId.scopes || settings.entraId.scopes.length === 0) {
             throw new Error("Configuration Error: 'entraId.scopes' must contain at least one scope.");
        }
    } 
    else {
        if (!settings.mockUsername) {
            throw new Error("Configuration Error: 'mockUsername' must be defined when Entra ID mocking is enabled.");
        }
    }
    if (settings.logDebug === undefined) {
        settings.logDebug = false;
    }
}

export const settingsManager = SettingsManager.create();

settingsManager.asyncRegister(AppSettings.key, StaticFetchSource.create({
    filePath: "./config",
    validator: validateSettings,
}));

export const useAppSettings = () => settingsManager.value(AppSettings.key);

(async function() {
    await settingsManager.forceLoad(AppSettings.key);
})();

function ReactComponent() {
    const settings = useAppSettings();
}