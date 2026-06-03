export type NestedKeyOf<TObject extends object> = {
  [Key in keyof TObject & (string | number)]: TObject[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<TObject[Key]>}`
    : `${Key}`;
}[keyof TObject & (string | number)];

// Infers the exact type at the end of the dot-notation path
export type NestedValueOf<TObject, TPath extends string> = 
  // Base case: If the path is a direct key (e.g., 'id' or 'profile')
  TPath extends keyof TObject 
    ? TObject[TPath] 
    // Recursive case: If the path has a dot (e.g., 'profile.name')
    : TPath extends `${infer Key}.${infer Rest}`
      ? Key extends keyof TObject
        ? NestedValueOf<TObject[Key], Rest>
        : never
      : never;

export type Nest<TObject extends object> = TObject & {
  [Path in NestedKeyOf<TObject>]: NestedValueOf<TObject, Path>;
};

// 1. Create a private Symbol that acts as our secret key
const RAW_TARGET = Symbol('RAW_TARGET');

function traverse(prop: string, target: any) {
  const parts = prop.split('.');
  let current = target;
  const traversed: string[] = [];

  for (let i = 0; i < parts.length; i++) {

    if (current == null || current == undefined) {
      const failedPath = traversed.join('.');
      throw new TypeError(
        `Nested-Proxy Error: Failed to resolve path '${prop}'. The property '${failedPath}' evaluated to ${String(current)}.`
      );
    }

    traversed.push(parts[i]);
    current = current[parts[i]];
  }

  return current;
}

export const Nest = {
  for<TObject extends object>(obj: TObject): Nest<TObject> {
    return new Proxy(obj as any, {
      get(target, prop) {
        if (prop === RAW_TARGET) {
          return target;
        }
        if (typeof prop === 'string' && prop.includes('.')) {
          return traverse(prop, target);
        }
        return Reflect.get(target, prop);
      }
    });
  },
  unwrap<TObject extends object>(nestObj: Nest<TObject>): TObject {
    return (nestObj as any)[RAW_TARGET];
  }
};