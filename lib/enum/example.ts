import { Enum } from "./Enums";

// 1. Defina o tipo do objeto complexo
type obj = {
  key1: string,
  key2: number,
}

// 3. Exporte o tipo "Branded"
export type Complex = Enum.Complex<obj, "complex">;

// 2. Defina os valores em um objeto constante
const ComplexValues: Enum.Values<Complex> = {
   obj1: { key1: "value1", key2: 1 },
   obj2: { key1: "value2", key2: 2 },
} as const;


// 4. Crie e exporte o construtor do Enum passando os genéricos
export const Complex = Enum.Complex.define<obj, typeof ComplexValues, "complex", Complex>(ComplexValues, "complex", Object.is);

// 1. Defina os valores em um objeto constante
const StatusValues: Enum.Values<Status> = {
   ativo: 1,
   inativo: 0,
} as const;

// 2. Exporte o tipo "Branded"
export type Status = Enum.Primitive<number, "status">;

// 3. Crie e exporte o construtor do Enum passando os genéricos
export const Status = Enum.Primitive.define<number, typeof StatusValues, "status", Status>(StatusValues);