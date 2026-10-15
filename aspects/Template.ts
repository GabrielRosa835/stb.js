import { Results, Attempt } from "../results";
import { Schema } from "./Schema";

export namespace Template {

  export type Primitive =
    | "string"
    | "number"
    | "boolean"
    | "null"
    | "unknown";
  
  export type LiteralValue = string | number | boolean;
  
  export type Literal<T extends LiteralValue = LiteralValue> = {
    readonly literal: T;
  };
  
  export type Optional<T extends Node = Node> = {
    readonly optional: T;
  };
  
  export type Nullable<T extends Node = Node> = {
    readonly nullable: T;
  };
  
  export type Either<T extends readonly [Node, Node, ...Node[]] = readonly [Node, Node, ...Node[]]> = {
    readonly either: T;
  };

  export type Array<T extends Node = Node> = readonly [T];
  
  export type Node =
    | Primitive
    | Literal<LiteralValue>
    | Optional<any>
    | Nullable<any>
    | Either<any>
    | Array<any>
    | { readonly [key: string]: any };
  
  type OptionalExtractor<T> = T extends Record<string, any> ? ({
    [K in keyof T as T[K] extends Optional<any> ? never : K]: Infer<T[K]>;
  } & {
    [K in keyof T as T[K] extends Optional<any> ? K : never]?: Infer<T[K]>;
  }) : never;

  /**
   * Infers the TypeScript static type from a Template AST.
   * Object properties wrapped in OptionalTemplate automatically become optional keys (?:).
   */
  export type Infer<T> =
    0 extends (1 & T) ? any :
    T extends "string" ? string :
    T extends "number" ? number :
    T extends "boolean" ? boolean :
    T extends "null" ? null :
    T extends "unknown" ? unknown :
    T extends Literal<infer L> ? L :
    T extends Optional<infer Inner> ? Infer<Inner> | undefined :
    T extends Nullable<infer Inner> ? Infer<Inner> | null :
    T extends Either<infer Members> ? (Members extends readonly (infer M)[] ? Infer<M> : never) :
    T extends readonly [infer Item extends Node] ? globalThis.Array<Infer<Item>> :
    { [K in keyof OptionalExtractor<T>]: OptionalExtractor<T>[K] };

  export const string = (): "string" => "string";
  export const number = (): "number" => "number";
  export const boolean = (): "boolean" => "boolean";
  export const nullLiteral = (): "null" => "null";
  export const unknown = (): "unknown" => "unknown";

  export const literal = <T extends LiteralValue>(val: T): Literal<T> => ({ literal: val });
  export const optional = <T extends Node>(inner: T): Optional<T> => ({ optional: inner });
  export const nullable = <T extends Node>(inner: T): Nullable<T> => ({ nullable: inner });
  export const either = <T extends readonly [Node, Node, ...Node[]]>(...members: T): Either<T> => ({ either: members });
  export const array = <T extends Node>(item: T): Array<T> => [item];
  export const object = <T extends Record<string, Node>>(shape: T): T => shape;

  export function serialize(template: Node): string {
    return JSON.stringify(template);
  }

  export function parse(raw: string): Attempt<Node> {
    try {
      const parsed = JSON.parse(raw);
      const validation = validateNode(parsed);
      return validation.isSuccess ? Results.success(parsed as Node) : Results.failure(validation.value);
    } catch (err) {
      return Results.failure(err instanceof Error ? err : new Error(String(err)));
    }
  }

  function validateNode(node: unknown, path = "root"): Attempt<void> {
    if (typeof node === "string") {
      const primitives = ["string", "number", "boolean", "null", "unknown"];
      if (primitives.includes(node)) return Results.success(undefined);
      return Results.failure(new Error(`Invalid template primitive '${node}' at '${path}'`));
    }

    if (Array.isArray(node)) {
      if (node.length !== 1) {
        return Results.failure(new Error(`Array template at '${path}' must contain exactly one element`));
      }
      return validateNode(node[0], `${path}[0]`);
    }

    if (typeof node === "object" && node !== null) {
      if ("optional" in node) {
        return validateNode((node as Optional).optional, `${path}.optional`);
      }
      if ("nullable" in node) {
        return validateNode((node as Nullable).nullable, `${path}.nullable`);
      }
      if ("either" in node) {
        const members = (node as Either).either;
        if (!Array.isArray(members) || members.length < 2) {
          return Results.failure(new Error(`Either template at '${path}.either' must contain an array of at least 2 templates`));
        }
        for (let i = 0; i < members.length; i++) {
          const check = validateNode(members[i], `${path}.either[${i}]`);
          if (check.isFailure) return check;
        }
        return Results.success(undefined);
      }
      if ("literal" in node) {
        const val = (node as Literal).literal;
        if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
          return Results.success(undefined);
        }
        return Results.failure(new Error(`Literal value at '${path}.literal' must be primitive`));
      }

      for (const [key, val] of Object.entries(node)) {
        const check = validateNode(val, `${path}.${key}`);
        if (check.isFailure) return check;
      }
      return Results.success(undefined);
    }

    return Results.failure(new Error(`Invalid template node at '${path}'`));
  }

  export function compile<T extends Node>(template: T): Schema<Infer<T>> {
    if (typeof template === "string") {
      switch (template) {
        case "string": return Schema.string() as any;
        case "number": return Schema.number() as any;
        case "boolean": return Schema.boolean() as any;
        case "null": return Schema.literal(null as any) as any;
        case "unknown": return Schema.unknown() as any;
      }
    }

    if (Array.isArray(template)) {
      const itemSchema = compile(template[0] as Node);
      return Schema.array(itemSchema) as any;
    }

    if (typeof template === "object" && template !== null) {
      if ("optional" in template) {
        return Schema.optional(compile((template as Optional).optional)) as any;
      }
      if ("nullable" in template) {
        return Schema.nullable(compile((template as Nullable).nullable)) as any;
      }
      if ("either" in template) {
        const memberSchemas = (template as Either).either.map((m) => compile(m as Node));
        return Schema.either(...(memberSchemas as [Schema<unknown>, Schema<unknown>, ...Schema<unknown>[]])) as any;
      }
      if ("literal" in template) {
        return Schema.literal((template as Literal).literal) as any;
      }

      const shapeSchemas: Record<string, Schema<unknown>> = {};
      for (const [key, val] of Object.entries(template)) {
        shapeSchemas[key] = compile(val as Node) as Schema<unknown>;
      }
      return Schema.object(shapeSchemas) as any;
    }

    throw new Error(`Unsupported template structure: ${JSON.stringify(template)}`);
  }
}
