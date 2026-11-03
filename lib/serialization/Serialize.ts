import { Serializable } from "../common/Serializable";

export type Serializer<T> = (this: T) => Serializable;

export namespace Serializer {
    /**
     * Sobrescreve o método padrão de transformação para JSON (`toJSON`), substituindo-o por um `serializer` customizado.
     * @param value A instância do objeto que se deseja modificar (ex: uma instância de `Date`).
     * @param serializer Função que acessa o objeto e retorna uma versão serializável. O acesso deve
     * ser realizado via `this`.
     * @returns A própria instância original do objeto mutada, permitindo o uso imediato da variável.
     */
    export function set<T>(value: T, serializer: Serializer<T>): T {
        // Intercepta a chamada nativa do motor JavaScript (V8) para JSON.stringify
        (value as any).toJSON = serializer;
        return value;
    }
}

export namespace Serialize {
    /**
     * Coleção de utilidades de serialização pré-construídas focadas em manipulação de Datas.
     */
    export const Date = {
        /**
         * Implementação de serialização que contorna a conversão automática do JavaScript 
         * de fusos horários (GMT/Local para UTC) disparada nativamente pelo `JSON.stringify()`.
         * 
         * **Comportamento padrão:** Uma data `18:00:00 -03:00` (GMT-3) é convertida via `toISOString()`, resultando na string `"21:00:00.000Z"`.
         * 
         * **Via interceptador:** A mesma data `18:00:00 -03:00` será serializada estritamente como `"18:00:00"`, 
         * preservando o horário local visualizado pelo usuário e ignorando o fuso horário (sem o sufixo `Z`).
         * 
         * @returns Uma string formatada similar ao padrão ISO 8601, mas configurada como um tempo local "Unspecified".
         */
        useTimeAsISO: function (this: Date): Serializable {
            const pad = (n: number, length: number = 2) => n.toString().padStart(length, '0');

            const year = this.getFullYear().toString();
            const month = pad(this.getMonth() + 1);
            const day = pad(this.getDate());
            const hours = pad(this.getHours());
            const minutes = pad(this.getMinutes());
            const seconds = pad(this.getSeconds());

            // Aplica o sufixo de milissegundos apenas se for maior que zero (padrão esperado por parsers C#)
            const milliseconds = this.getMilliseconds() > 0 ? `.${pad(this.getMilliseconds(), 3)}` : "";

            // Nota: O retorno omite propositalmente o 'Z' no final!
            const result = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${milliseconds}`;

            return result;
        },
    }
}