import { Serializable } from "./SerializationService";

export type Serialize = {
    /**
     * Coleção de utilidades de serialização pré-construídas focadas em manipulação de Datas.
     */
    date: {
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
        useTimeAsISO: (this: Date) => Serializable;
    }
}

function useTimeAsISO (this: Date): Serializable {
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
};

export const Serialize = {
    date: {
        useTimeAsISO,
    }
}