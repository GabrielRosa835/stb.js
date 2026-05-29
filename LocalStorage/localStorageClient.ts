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

export type LocalStorageOptions<TKeysExtension extends Record<string, StorageKey<Serializable>> = {}> = {
    /** Prefixo adicionado automaticamente a todas as chaves no local-storage. */
    keyPrefix?: string;
    /** Dicionário de chaves adicionais que estendem as chaves padrão do serviço. */
    keyExtensions?: TKeysExtension
}

export type LocalStorageService<TKeys extends Record<string, StorageKey<Serializable>>> = {
    get: <S extends Serializable>(key: StorageKey<S> | string) => S | null;
    put: <S extends Serializable>(key: StorageKey<S> | string, value: S) => void;
    remove: (key: StorageKey<Serializable> | string) => void;
    /** Dicionário de chaves disponíveis (combinando as chaves padrão, aplicação e contexto). */
    keys: typeof defaultLocalStorageKeys & TKeys;
}

// Level 1: Application (Definition)
export function defineLocalStorage<TAppKeys extends Record<string, StorageKey<Serializable>> = {}>(
    appOptions?: LocalStorageOptions<TAppKeys>
) {
    
    // Level 2: Context (Factory)
    return function createService<TContextKeys extends Record<string, StorageKey<Serializable>> = {}>(
        contextOptionsOrCb?: LocalStorageOptions<TContextKeys> | ((appOpts?: LocalStorageOptions<TAppKeys>) => LocalStorageOptions<TContextKeys>)
    ): LocalStorageService<TAppKeys & TContextKeys> {
        
        const contextOptions = typeof contextOptionsOrCb === 'function' 
            ? contextOptionsOrCb(appOptions) 
            : contextOptionsOrCb;

        // Resolve prefix (Context overrides Application)
        const prefix = contextOptions?.keyPrefix ?? appOptions?.keyPrefix ?? "";

        // Merge keys (Default + Application + Context)
        const keys = {
            ...defaultLocalStorageKeys,
            ...(appOptions?.keyExtensions ?? {}),
            ...(contextOptions?.keyExtensions ?? {})
        } as typeof defaultLocalStorageKeys & TAppKeys & TContextKeys;

        // SSR Safety check: Ensure window is defined before accessing localStorage
        const isBrowser = typeof window !== "undefined";

        // Level 3: Execution (Methods)
        const get = <S extends Serializable>(key: StorageKey<S> | string): S | null => {
            if (!isBrowser) return null;
            try {
                const value = localStorage.getItem(prefix + key);
                return value ? JSON.parse(value) : null;
            } catch {
                return null;
            }
        };

        const put = <S extends Serializable>(key: StorageKey<S> | string, value: S): void => {
            if (!isBrowser) return;
            localStorage.setItem(prefix + key, JSON.stringify(value));
        };

        const remove = (key: StorageKey<Serializable> | string): void => {
            if (!isBrowser) return;
            localStorage.removeItem(prefix + key);
        };

        return {
            get,
            put,
            remove,
            keys,
        };
    }
}