/**
 * A type that can have inner fields and are compared by reference
 */
export type NonPrimitive = object | { [key: string]: unknown } | unknown[] | Function;

function transform<
    T extends NonPrimitive,
    Values extends Record<string, T>,
    Type extends string,
    E extends NonPrimitiveEnum<T, Values, Type>
>(value: T, name: string, key: Type): E {
    const valor = value as unknown as E;
    valor.__name = name;
    valor.__type = key;
    return valor;
}

function displayFactory<
    T extends NonPrimitive, 
    Values extends Record<string, T>, 
    Type extends string, 
    E extends NonPrimitiveEnum<T, Values, Type>
>(): (e: E) => string {
    return function (e: E) {
        return e.__name;
    }
}

function parseFactory<
    T extends NonPrimitive,
    Values extends Record<string, T>,
    Type extends string,
    E extends NonPrimitiveEnum<T, Values, Type>
>(values: Values, key: Type, equalityComparer: (v1: T, v2: T) => boolean): (v: T) => E {
    return function (value: T): E {
        const entry = Object.entries(values).find(([k, v]) => equalityComparer(value, v));
        if (!entry) {
            throw new Error("Cannot parse value");
        }
        return transform(value, entry[0], key);
    }
}

function spreadFactory<
    T extends NonPrimitive,
    Values extends Record<string, T>,
    Type extends string,
    E extends NonPrimitiveEnum<T, Values, Type>
>(values: Values, key: Type): { [K in keyof Values]: E } {
    const obj: any = {};
    Object.entries(values).forEach(([k, v]) => obj[k] = transform(v, k, key));
    return obj;
}

function valuesFactory<
    T extends NonPrimitive,
    Values extends Record<string, T>,
    Type extends string,
    E extends NonPrimitiveEnum<T, Values, Type>
>(values: Values, key: Type): E[] {
    return Object.entries(values).map(([k, v]) => transform(v, k, key));
}

function create<
    T extends NonPrimitive,
    Values extends Record<string, T>,
    Type extends string,
    E extends NonPrimitiveEnum<T, Values, Type>
>(values: Values, key: Type, equalityComparer: (v1: T, v2: T) => boolean, customDisplay?: (e: E) => string) {
    const display = customDisplay ?? displayFactory<T, Values, Type, E>();
    return {
        ...spreadFactory<T, Values, Type, E>(values, key),
        values: valuesFactory<T, Values, Type, E>(values, key),
        parse: parseFactory<T, Values, Type, E>(values, key, equalityComparer),
        display: display,
    };
}

/**
 * Tipo base para a criação de Enums "Branded".
 * Intercepta um tipo complexo (T) e adiciona metadados úteis para o runtime.
 */
export type NonPrimitiveEnum<
    T extends NonPrimitive,
    Values extends Record<string, T>,
    Type extends string,
> = T & {
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
 * @param equalityComparer Função que compara instâncias de `T` em busca de equalidade.
 * @param customDisplay Função opcional para customizar a exibição do nome do Enum.
 * @returns Um objeto com: 
 * * Os valores do Enum para acesso via chave, 
 * * `values` - Lista dos valores parseados 
 * * `parse()` - Transformador de T para o Enum
 * * `display()` - Método para gerar uma string de exibição. A implementação padrão recupera a 
 * chave daquele valor da lista de constantes, podendo ser substituída com `customDisplay`.
 * @example
 * ```
 * // 1. Defina o tipo do objeto complexo
 * type obj = {
 *   key1: string,
 *   key2: number,
 * }
 * 
 * // 2. Defina os valores em um objeto constante
 * const ComplexValues: Record<string, obj> = {
 *    obj1: { key1: "value1", key2: 1 },
 *    obj2: { key1: "value2", key2: 2 },
 * } as const;
 * 
 * // 3. Exporte o tipo "Branded"
 * export type Complex = Enum<obj, typeof ComplexValues, "complex">;
 * 
 * // 4. Crie e exporte o construtor do Enum passando os genéricos
 * export const Complex = Enum.create<obj, typeof ComplexValues, "complex", Complex>(ComplexValues, "complex");
 * 
 * // 5. Uso limpo no restante da aplicação:
 * const meuObj: Complex = Complex.obj1;
 * const nomeObj = meuObj.__name; // "obj1"
 * const tipoEnum = meuObj.__type; // "complex"
 * const objParseado = Complex.parse({ key1: "value1", key2: 1 });
 * const todosOsObjs = Complex.values;
 * console.log(Complex.display(meuObj)); // "obj1"
 * ```
 */
export const NonPrimitiveEnum = { create };