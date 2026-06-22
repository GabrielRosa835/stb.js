/**
 * A type that cannot have inner fields and are compared by value
 */
export type PrimitiveTypes = number | string | undefined | null | bigint | boolean | symbol;

/**
 * A type that can have inner fields and are compared by reference
 */
export type NonPrimitiveTypes = object | { [key: string]: unknown } | unknown[] | Function;

type EnumComplement<Type extends string, Base = unknown> = {
    __type: Type,
    __name: string,
    __base?: Base;
}

type PrimitiveEnum<T extends PrimitiveTypes, Type extends string> = T & EnumComplement<Type, T>;

type NonPrimitiveEnum<T extends NonPrimitiveTypes, Type extends string> = T & EnumComplement<Type, T>;

function npTransform<
    T extends NonPrimitiveTypes,
    Type extends string,
    E extends NonPrimitiveEnum<T, Type>
>(value: T, name: string, key: Type): E {
    const valor = value as unknown as E;
    valor.__name = name;
    valor.__type = key;
    return valor;
}

function npDisplayFactory<
    T extends NonPrimitiveTypes, 
    Type extends string, 
    E extends NonPrimitiveEnum<T, Type>
>(): (e: E) => string {
    return function (e: E) {
        return e.__name;
    }
}

function npParseFactory<
    T extends NonPrimitiveTypes,
    Values extends Record<string, T>,
    Type extends string,
    E extends NonPrimitiveEnum<T, Type>
>(values: Values, key: Type, equalityComparer: (v1: T, v2: T) => boolean): (v: T) => E {
    return function (value: T): E {
        const entry = Object.entries(values).find(([k, v]) => equalityComparer(value, v));
        if (!entry) {
            throw new Error("Cannot parse value");
        }
        return npTransform(value, entry[0], key);
    }
}

function npSpreadFactory<
    T extends NonPrimitiveTypes,
    Values extends Record<string, T>,
    Type extends string,
    E extends NonPrimitiveEnum<T, Type>
>(values: Values, key: Type): { [K in keyof Values]: E } {
    const obj: any = {};
    Object.entries(values).forEach(([k, v]) => obj[k] = npTransform(v, k, key));
    return obj;
}

function npValuesFactory<
    T extends NonPrimitiveTypes,
    Values extends Record<string, T>,
    Type extends string,
    E extends NonPrimitiveEnum<T, Type>
>(values: Values, key: Type): E[] {
    return Object.entries(values).map(([k, v]) => npTransform(v, k, key));
}

function npDefine<
    T extends NonPrimitiveTypes,
    Values extends Record<string, T>,
    Type extends string,
    E extends NonPrimitiveEnum<T, Type>
>(values: Values, key: Type, equalityComparer: (v1: T, v2: T) => boolean, customDisplay?: (e: E) => string) {
    const display = customDisplay ?? npDisplayFactory<T, Type, E>();
    return {
        ...npSpreadFactory<T, Values, Type, E>(values, key),
        values: npValuesFactory<T, Values, Type, E>(values, key),
        parse: npParseFactory<T, Values, Type, E>(values, key, equalityComparer),
        display: display,
    };
}



function pCast<T>(value: any): T {
    return value as unknown as T;
}

function pDisplayFactory<
    T extends PrimitiveTypes, 
    Values extends Record<string, T>, 
    Type extends string, 
    E extends PrimitiveEnum<T, Type>
>(values: Values): (e: E) => string {
    return function (e: E) {
        return Object.entries(values).find(([k, v]) => pCast<T>(e) === v)![0];
    }
}

function pParseFactory<
    T extends PrimitiveTypes,
    Values extends Record<string, T>,
    Type extends string,
    E extends PrimitiveEnum<T, Type>
>(values: Values): (v: T) => E {
    return function (value: T): E {
        const entry = Object.entries(values).find(([k, v]) => value === v);
        if (!entry) {
            throw new Error("Cannot parse value");
        }
        return pCast<E>(entry[1]);
    }
}

function pSpreadFactory<
    T extends PrimitiveTypes,
    Values extends Record<string, T>,
    Type extends string,
    E extends PrimitiveEnum<T, Type>
>(values: Values): { [K in keyof Values]: E } {
    const obj: any = {};
    Object.entries(values).forEach(([k, v]) => obj[k] = pCast<E>(v));
    return obj;
}

function pValuesFactory<
    T extends PrimitiveTypes,
    Values extends Record<string, T>,
    Type extends string,
    E extends PrimitiveEnum<T, Type>
>(values: Values): E[] {
    return Object.values(values).map(pCast<E>);
}

function pDefine<
    T extends PrimitiveTypes,
    Values extends Record<string, T>,
    Type extends string,
    E extends PrimitiveEnum<T, Type>
>(values: Values, customDisplay?: (e: E) => string) {
    const display = customDisplay ?? pDisplayFactory<T, Values, Type, E>(values);
    return {
        ...pSpreadFactory<T, Values, Type, E>(values),
        values: pValuesFactory<T, Values, Type, E>(values),
        parse: pParseFactory<T, Values, Type, E>(values),
        display: display,
    };
}

const PrimitiveEnum = { define: pDefine };

const NonPrimitiveEnum = { define: npDefine };

export namespace Enum {

    export const Primitive = PrimitiveEnum;
    export type Primitive<
        T extends PrimitiveTypes, 
        Type extends string
    > = PrimitiveEnum<T, Type>;

    export const Complex = NonPrimitiveEnum;
    export type Complex<
        T extends NonPrimitiveTypes,
        Type extends string,
    > = NonPrimitiveEnum<T, Type>;

    export type Complement<Type extends string> = EnumComplement<Type>;

    export type Values<TEnum> = TEnum extends EnumComplement<any, infer Base> 
        ? Record<string, Base> 
        : never;
}