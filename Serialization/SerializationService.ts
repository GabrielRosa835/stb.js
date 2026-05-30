/**
 * Tipos básicos aceitos como retorno válido em um processo de serialização JSON.
 */
export type Serializable = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: Serializable } 
  | Serializable[];

export type SerializationService = {
    /**
     * Sobrescreve o método padrão de transformação para JSON (`toJSON`), substituindo-o por um `serializer` customizado.
     * @param value A instância do objeto que se deseja modificar (ex: uma instância de `Date`).
     * @param serializer Função que acessa o objeto e retorna uma versão serializável. O acesso deve
     * ser realizado via `this`.
     * @returns A própria instância original do objeto mutada, permitindo o uso imediato da variável.
     */
    setSerializer: <T>(value: T, serializer: ((this: T) => Serializable)) => T;
}

function createService(): SerializationService {

    function setSerializer<T>(value: T, serializer: ((this: T) => Serializable)): T {
        // Intercepta a chamada nativa do motor JavaScript (V8) para JSON.stringify
        (value as any).toJSON = serializer;
        return value;
    }

    return {
        setSerializer
    };
}

export const SerializationService = {
    create: createService,
}