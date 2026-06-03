export type Serializable = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: Serializable } 
  | Serializable[];

/**
 * Tipo utilitário (branded type) que representa uma chave do local-storage.
 * Vincula uma string ao tipo do dado (`S`) que será armazenado, garantindo segurança de tipagem.
 */
export type StorageKey<S extends Serializable> = string & { __type: S };

const defaultLocalStorageKeys = {
    token: "token" as StorageKey<string>,
}

export type DefaultLocalStorageKeys = typeof defaultLocalStorageKeys;

export type LocalStorageOptions<TKeysExtension extends Record<string, StorageKey<Serializable>> = {}> = {
    /** Prefixo adicionado automaticamente a todas as chaves no local-storage. */
    keyPrefix?: string;
    /** Dicionário de chaves adicionais que estendem as chaves padrão do serviço. */
    keyExtensions?: TKeysExtension
}

export type LocalStorageConfigurationOptions<TKeysExtension extends Record<string, StorageKey<Serializable>> = {}> = LocalStorageOptions<TKeysExtension>;
export type LocalStorageServiceOptions<TKeysExtension extends Record<string, StorageKey<Serializable>> = {}> = LocalStorageOptions<TKeysExtension>;

export type LocalStorageService<TKeys extends Record<string, StorageKey<Serializable>>> = {
    get: <S extends Serializable>(key: StorageKey<S> | string) => S | null;
    put: <S extends Serializable>(key: StorageKey<S> | string, value: S) => void;
    remove: (key: StorageKey<Serializable> | string) => void;
    /** Dicionário de chaves disponíveis (combinando as chaves padrão, aplicação e contexto). */
    keys: DefaultLocalStorageKeys & TKeys;
}

// Level 1: Application (Definition)
function configureLocalStorageService<TAppKeys extends Record<string, StorageKey<Serializable>> = {}>(
    configurationOptions?: LocalStorageConfigurationOptions<TAppKeys>
) {
    if (typeof window === "undefined") {
        throw new Error("Cannot use localStorage outside a browser");
    }
    
    // Level 2: Context (Factory)
    return function createService<TContextKeys extends Record<string, StorageKey<Serializable>> = {}>(
        serviceOptions?: LocalStorageServiceOptions<TContextKeys>
    ): LocalStorageService<TAppKeys & TContextKeys> {

        const keys = {
            ...defaultLocalStorageKeys,
            ...(configurationOptions?.keyExtensions ?? {}),
            ...(serviceOptions?.keyExtensions ?? {})
        } as DefaultLocalStorageKeys & TAppKeys & TContextKeys;

        const options = {
            keyExtensions: keys,
            keyPrefix: serviceOptions?.keyPrefix ?? configurationOptions?.keyPrefix ?? "",
        }

        // Level 3: Execution (Methods)
        const get = <S extends Serializable>(key: StorageKey<S> | string): S | null => {
            try {
                const value = localStorage.getItem(options.keyPrefix + key);
                return value ? JSON.parse(value) : null;
            } catch {
                return null;
            }
        };

        const put = <S extends Serializable>(key: StorageKey<S> | string, value: S): void => {
            localStorage.setItem(options.keyPrefix + key, JSON.stringify(value));
        };
        const remove = (key: StorageKey<Serializable> | string): void => {
            localStorage.removeItem(options.keyPrefix + key);
        };

        return {
            get,
            put,
            remove,
            keys,
        };
    }
}

export const LocalStorageService = {
    specify: configureLocalStorageService,
}