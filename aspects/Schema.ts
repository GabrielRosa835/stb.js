import { NonEmptyArray } from "../common/NonEmptyArray";
import { Results, Attempt } from "../results";

export type Schema<T> = {
  isValid: (value: unknown) => boolean;
  validate: Schema.Validator<T>;
}

export namespace Schema {

  export type Validator<T> = (value: unknown, path?: string) => Attempt<T, NonEmptyArray<Error>>;

  export type Infer<S> = S extends Schema<infer T> ? T : never;

  function toSchema<T>(validator: Validator<T>): Schema<T> {
    return {
      validate: validator,
      isValid: (val) => validator(val).isSuccess,
    }
  }

  export const string = () => toSchema(stringValidator);
  const stringValidator: Validator<string> = (val, path = "") => typeof val === "string"
    ? Results.success(val)
    : Results.failure([new Error(`Expected string at '${path || "root"}', received ${typeof val}`)]);

  export const number = () => toSchema(numberValidator);
  const numberValidator: Validator<number> = (val, path = "") => typeof val === "number" && !Number.isNaN(val)
    ? Results.success(val)
    : Results.failure([new Error(`Expected valid number at '${path || "root"}', received ${typeof val}`)]);

  export const boolean = () => toSchema(booleanValidator);
  const booleanValidator: Validator<boolean> = (val, path = "") => typeof val === "boolean"
    ? Results.success(val)
    : Results.failure([new Error(`Expected boolean at '${path || "root"}', received ${typeof val}`)]);

  export const unknown = () => toSchema(unknownValidator);
  const unknownValidator: Validator<unknown> = (val) => Results.success(val);

  export const literal = <T extends string | number | boolean>(expected: T) => toSchema(literalValidator(expected));
  const literalValidator = <T extends string | number | boolean>(expected: T): Validator<T> => (val, path = "") => val === expected
    ? Results.success(val as T)
    : Results.failure([new Error(`Expected literal '${String(expected)}' at '${path || "root"}', received '${String(val)}'`)]);

  export const optional = <T>(inner: Schema<T>) => toSchema(optionalValidator(inner));
  const optionalValidator = <T>(inner: Schema<T>): Validator<T | undefined> => (val, path = "") => {
    if (val === undefined) return Results.success(undefined);
    return inner.validate(val, path);
  };

  export const nullable = <T>(inner: Schema<T>) => toSchema(nullableValidator(inner));
  const nullableValidator = <T>(inner: Schema<T>): Validator<T | null> => (val, path = "") => {
    if (val === null) return Results.success(null);
    return inner.validate(val, path);
  }

  export const object = <T extends Record<string, Schema<unknown>>>(shape: T) => toSchema(objectValidator(shape));
  const objectValidator = <T extends Record<string, Schema<unknown>>>(shape: T): Validator<{ [K in keyof T]: Infer<T[K]>; }> => (val, path = "") => {
    if (typeof val !== "object" || val === null || Array.isArray(val)) {
      return Results.failure([new Error(`Expected object at '${path || "root"}', received ${typeof val}`)]);
    }
    const record = val as Record<string, unknown>;
    const result: Record<string, unknown> = {};

    const failures: NonEmptyArray<Error> = [] as any;
    for (const [key, propSchema] of Object.entries(shape)) {
      const propPath = path ? `${path}.${key}` : key;
      const check = propSchema.validate(record[key], propPath);
      if (check.isFailure) {
        failures.push(...check.value);
      }
      else {
        result[key] = check.value;
      }
    }
    if (failures.length > 0) {
      return Results.failure(failures);
    }
    return Results.success(result as {
      [K in keyof T]: Infer<T[K]>;
    });
  };

  export const array = <T>(itemSchema: Schema<T>) => toSchema(arrayValidator(itemSchema));
  const arrayValidator = <T>(itemSchema: Schema<T>): Validator<T[]> => (val, path = "") => {
    if (!Array.isArray(val)) {
      return Results.failure([new Error(`Expected array at '${path || "root"}', received ${typeof val}`)]);
    }
    const items: T[] = [];
    const failures: NonEmptyArray<Error> = [] as any;
    for (let i = 0; i < val.length; i++) {
      const check = itemSchema.validate(val[i], `${path}[${i}]`);
      if (check.isFailure) {
        failures.push(...check.value);
      }
      else {
        items.push(check.value);
      }
    }
    if (failures.length > 0) {
      return Results.failure(failures);
    }
    return Results.success(items);
  };

  export const either = <T extends readonly [Schema<unknown>, Schema<unknown>, ...Schema<unknown>[]]>(...schemas: T) => toSchema(eitherValidator(...schemas))
  const eitherValidator = <T extends readonly [Schema<unknown>, Schema<unknown>, ...Schema<unknown>[]]>(
    ...schemas: T
  ): Validator<{ [K in keyof T]: Infer<T[K]> }[number]> => (val, path = "") => {
    const errors: Error[] = [];
    for (let i = 0; i < schemas.length; i++) {
      const check = schemas[i].validate(val, path);
      if (check.isSuccess) {
        return check as any;
      }
      errors.push(...check.value);
    }
    const generalError = new Error(`Expected value at '${path || "root"}' to match one of the candidate schemas. Failures: [${errors.map((e) => e.message).join("; ")}]`);
    return Results.failure([generalError, ...errors]);
  };
}
