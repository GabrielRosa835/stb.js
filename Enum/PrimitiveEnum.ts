/**
 * A type that cannot have inner fields and are compared by value
 */
export type Primitive = number | string | undefined | null | bigint | boolean | symbol;

function cast<T>(value: any): T {
    return value as unknown as T;
}

function displayFactory<
    T extends Primitive, 
    Values extends Record<string, T>, 
    Type extends string, 
    E extends PrimitiveEnum<T, Values, Type>
>(values: Values): (e: E) => string {
    return function (e: E) {
        return Object.entries(values).find(([k, v]) => cast<T>(e) === v)![0];
    }
}

function parseFactory<
    T extends Primitive,
    Values extends Record<string, T>,
    Type extends string,
    E extends PrimitiveEnum<T, Values, Type>
>(values: Values): (v: T) => E {
    return function (value: T): E {
        const entry = Object.entries(values).find(([k, v]) => value === v);
        if (!entry) {
            throw new Error("Cannot parse value");
        }
        return cast<E>(entry[1]);
    }
}

function spreadFactory<
    T extends Primitive,
    Values extends Record<string, T>,
    Type extends string,
    E extends PrimitiveEnum<T, Values, Type>
>(values: Values): { [K in keyof Values]: E } {
    const obj: any = {};
    Object.entries(values).forEach(([k, v]) => obj[k] = cast<E>(v));
    return obj;
}

function valuesFactory<
    T extends Primitive,
    Values extends Record<string, T>,
    Type extends string,
    E extends PrimitiveEnum<T, Values, Type>
>(values: Values): E[] {
    return Object.values(values).map(cast<E>);
}

function create<
    T extends Primitive,
    Values extends Record<string, T>,
    Type extends string,
    E extends PrimitiveEnum<T, Values, Type>
>(values: Values, customDisplay?: (e: E) => string) {
    const display = customDisplay ?? displayFactory<T, Values, Type, E>(values);
    return {
        ...spreadFactory<T, Values, Type, E>(values),
        values: valuesFactory<T, Values, Type, E>(values),
        parse: parseFactory<T, Values, Type, E>(values),
        display: display,
    };
}

/**
 * Tipo base para a criação de Enums "Branded".
 * Intercepta um tipo primitivo (T) e adiciona metadados úteis para o TypeScript.
 */
export type PrimitiveEnum<T extends Primitive, Values extends Record<string, T>, Type extends string> = T & {
    __type: Type,
    __name: string,
}

/**
 * Cria a instância de um Enum tipado (Branded Enum) com métodos utilitários.
 * 
 * **NOTA:** Embora a declaração inicial exija a passagem manual dos tipos genéricos 
 * (o que pode parecer um pouco verboso), esta abordagem foi escolhida para 
 * garantir que o consumo do Enum pelo cliente seja extremamente limpo, seguro 
 * e com excelente suporte à inferência e autocompletar na IDE.
 * @param type O identificador único do tipo deste Enum (ex: "status").
 * @param values O objeto literal constante contendo as chaves e valores.
 * @param customDisplay Função opcional para customizar a exibição do nome do Enum.
 * @returns Um objeto com: 
 * * Os valores do Enum para acesso via chave, 
 * * `values` - Lista dos valores parseados 
 * * `parse()` - Transformador de P para o Enum
 * * `display()` - Método para gerar uma string de exibição. A implementação padrão recupera a 
 * chave daquele valor da lista de constantes, podendo ser substituída com `customDisplay`.
 * @example
 * ```
 * // 1. Defina os valores em um objeto constante
 * const StatusValues = {
 *    ativo: 1,
 *    inativo: 0,
 * } as const;
 * 
 * // 2. Exporte o tipo "Branded"
 * export type Status = Enum<number, typeof StatusValues, "status">;
 * 
 * // 3. Crie e exporte o construtor do Enum passando os genéricos
 * export const Status = Enum.create<number, typeof StatusValues, "status", Status>(StatusValues, "status");
 * 
 * // Uso limpo no restante da aplicação:
 * const meuStatus: Status = Status.ativo;
 * const valor: number = meuStatus;
 * const statusParseado = Status.parse(1);
 * const todosOsStatus = Status.values;
 * console.log(Status.display(meuStatus)); // "ativo"
 * ```
 */
export const PrimitiveEnum = { create };