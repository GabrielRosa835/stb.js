export function exists<T>(value: T | null | undefined): value is T {
  return value !== undefined && value !== null;
}

export function empty<T extends string | unknown[]>(array: T | string | undefined): array is T {
  if (typeof array === "string") return array === "";
  return exists(array) && array.length === 0;
}

export function unused(args?: any): any { }

export function log<T>(args: T, prefix?: string): T {
  if (prefix) console.log(prefix, args);
  else console.log(args);
  return args;
}

export function assert<T>(condition: boolean | ((args?: T) => boolean), message?: string | Error): T | any {
  let result;
  if (typeof condition === "function") {
    result = condition();
  } else {
    result = condition;
  }
  if (!result) {
    let error;
    if (typeof message === "string") {
      error = new Error(message ?? "Assertion failed");
    }
    else if (typeof message === "undefined") {
      error = new Error("Assertion failed");
    }
    else /* type === Error */ {
      error = message;
    }
    console.log(error);
    throw error;
  }
  return;
}

export const utilities = { exists, empty, unused, log, assert };

export default utilities;

/**
 * Para adicionar componentes globais no projeto cliente, 
 * basta importar diretamente este arquivo.
 * Recomenda-se realizar a importação diretamente em main.tsx,
 * para propagar as declarações globais por todo o projeto.
 * ```
 * import "@fazsoftsolutions/fazsoft-react-lib-test/global.d.ts";
 * ```
 */
declare global {
  /**
   * Tipo utilitário para indicar algo que não será utilizado.
   */
  type Unused = any;

  /**
   * Verifica se o valor não é nulo nem indefinido, ignorando outros valores "falsy" (como 0 ou false).
   */
  function exists<T>(value: T | null | undefined): value is T;

  /**
   * Verifica se um array ou string existe e está vazio.
   */
  function empty<T extends string | unknown[]>(array: T | string | undefined): array is T;

  /**
   * Preenche restrições do TypeScript em locais onde um argumento é exigido, mas sabe-se que não será utilizado.
   */
  function unused(args?: any): any;
  /**
   * Imprime os dados no console e retorna o próprio valor, permitindo seu uso contínuo dentro de expressões.
   */
  function log<T>(args: T, prefix?: string): T;

  /**
   * Lança um erro se a condição não for atendida (falsa).
   */
  function assert<T>(statement: boolean | ((args?: T) => boolean), message?: string | Error): T | any;
}

if (typeof globalThis !== "undefined") {
  globalThis.exists = utilities.exists;
  globalThis.empty = utilities.empty;
  globalThis.unused = utilities.unused;
  globalThis.log = utilities.log;
  globalThis.assert = utilities.assert;
}

export { };