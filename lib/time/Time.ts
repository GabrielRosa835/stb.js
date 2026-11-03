const HOURS_TO_MILLIS = 3600000;
const MINS_TO_MILLIS = 60000;
const SECS_TO_MILLIS = 1000;

/**
 * Representa um intervalo de tempo ou duração.
 * 
 * **Observação:** Esta classe foi desenhada para transitar de forma 
 * transparente entre o front (React) e o back (ASP.NET Core), interceptando `JSON.stringify()`
 * com uma implementação que já mapeia para uma string no formato de `TimeSpan`.
 */
export class Time {
    /** Armazenamento interno e imutável da duração total em milissegundos. */
    private readonly _totalMilliseconds: number;

    private constructor(milliseconds: number) {
        this._totalMilliseconds = milliseconds;
    }

    /** Obtém o componente de horas do intervalo de tempo (excluindo dias, se houvesse). */
    get hours(): number { return Math.floor(this._totalMilliseconds / HOURS_TO_MILLIS); }
    /** Obtém o valor fracionário total de horas que este intervalo representa. */
    get totalHours(): number { return this._totalMilliseconds * HOURS_TO_MILLIS; }
    

    /** Obtém o componente de minutos do intervalo de tempo (entre 0 e 59). */
    get minutes(): number { return Math.floor((this._totalMilliseconds % HOURS_TO_MILLIS) / MINS_TO_MILLIS); }
    /** Obtém o valor fracionário total de minutos que este intervalo representa. */
    get totalMinutes(): number { return this._totalMilliseconds * MINS_TO_MILLIS; }

    /** Obtém o componente de segundos do intervalo de tempo (entre 0 e 59). */
    get seconds(): number { return Math.floor((this._totalMilliseconds % MINS_TO_MILLIS) / SECS_TO_MILLIS); }
    /** Obtém o valor fracionário total de segundos que este intervalo representa. */
    get totalSeconds(): number { return this._totalMilliseconds * SECS_TO_MILLIS; }

    /** Obtém o componente de milissegundos do intervalo de tempo (entre 0 e 999). */
    get milliseconds(): number { return this._totalMilliseconds % SECS_TO_MILLIS; }
    /** Obtém o total absoluto de milissegundos que este intervalo representa. */
    get totalMilliseconds(): number { return this._totalMilliseconds; }

    /**
     * Retorna uma nova instância de `Time` cujo valor é o resultado da adição da instância especificada a esta instância.
     * @param ts O intervalo de tempo a ser adicionado.
     * @returns Uma nova instância de `Time`.
     */
    add(ts: Time): Time {
        return new Time(this._totalMilliseconds + ts.totalMilliseconds);
    }

    /**
     * Retorna uma nova instância de `Time` que adiciona o número especificado de horas a esta instância.
     * @param value O número de horas a ser adicionado (pode ser negativo).
     * @returns Uma nova instância de `Time`.
     */
    addHours(value: number): Time {
        return new Time(this._totalMilliseconds + (value * HOURS_TO_MILLIS));
    }

    /**
     * Retorna uma nova instância de `Time` que adiciona o número especificado de minutos a esta instância.
     * @param value O número de minutos a ser adicionado (pode ser negativo).
     * @returns Uma nova instância de `Time`.
     */
    addMinutes(value: number): Time {
        return new Time(this._totalMilliseconds + (value * MINS_TO_MILLIS));
    }

    /**
     * Retorna uma nova instância de `Time` que adiciona o número especificado de segundos a esta instância.
     * @param value O número de segundos a ser adicionado (pode ser negativo).
     * @returns Uma nova instância de `Time`.
     */
    addSeconds(value: number): Time {
        return new Time(this._totalMilliseconds + (value * SECS_TO_MILLIS));
    }

    /**
     * Retorna uma nova instância de `Time` que adiciona o número especificado de milissegundos a esta instância.
     * @param value O número de milissegundos a ser adicionado (pode ser negativo).
     * @returns Uma nova instância de `Time`.
     */
    addMilliseconds(value: number): Time {
        return new Time(this._totalMilliseconds + value);
    }

    /**
     * Retorna uma nova instância de `Time` cujo valor é a negação (inversão de sinal) desta instância.
     * **Nota:** utilize este método para realizar subtrações. Ex: `tempo1.add(tempo2.negate())`.
     * @returns Uma nova instância de `Time`.
     */
    negate(): Time {
        return new Time(-this._totalMilliseconds);
    }

    /**
     * Compara esta instância com um objeto `Time` especificado e indica se esta instância é mais curta, 
     * igual ou mais longa que o objeto especificado.
     * @param other O intervalo de tempo a ser comparado.
     * @returns Um número que indica a relação entre as instâncias:
     * - `-1`: Esta instância é menor (mais curta) que `other`.
     * - `0`: As instâncias representam o mesmo intervalo de tempo.
     * - `1`: Esta instância é maior (mais longa) que `other`.
     */
    compareTo(other: Time): number {
        if (this._totalMilliseconds < other.totalMilliseconds) return -1;
        if (this._totalMilliseconds > other.totalMilliseconds) return 1;
        return 0;
    }

    /**
     * Retorna um valor que indica se esta instância é igual a um objeto `Time` especificado.
     * @param other O intervalo de tempo a ser comparado.
     * @returns `true` se os intervalos de tempo forem idênticos; caso contrário, `false`.
     */
    equals(other?: Time): boolean {
        return other !== null && other !== undefined && this._totalMilliseconds === other.totalMilliseconds;
    }

    /** Indica se este intervalo de tempo é exatamente zero. */
    get isZero(): boolean {
        return this._totalMilliseconds === 0;
    }

    /** Indica se este intervalo de tempo representa uma duração negativa. */
    get isNegative(): boolean {
        return this._totalMilliseconds < 0;
    }

    /** Indica se este intervalo de tempo representa uma duração positiva (maior que zero). */
    get isPositive(): boolean {
        return this._totalMilliseconds > 0;
    }

    /**
     * Atribui os valores atuais de tempo a uma instância de `Date`.
     * @param date A data original
     * @returns Uma nova instância de `Date`, com os valores de data iguais ao original e os
     * de tempo copiados da instância atual de `Time`
     */
    merge(date: Date): Date {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
            this.hours, this.minutes, this.seconds, this.milliseconds);
    }

    /**
     * Cria uma nova instância de `Time` a partir dos componentes de tempo especificados.
     * @param hours Quantidade de horas.
     * @param minutes Quantidade de minutos (padrão: 0).
     * @param seconds Quantidade de segundos (padrão: 0).
     * @param milliseconds Quantidade de milissegundos (padrão: 0).
     * @returns Uma nova instância de `Time`.
     */
    static from(hours: number, minutes: number = 0, seconds: number = 0, milliseconds: number = 0): Time {
        const total = (hours * HOURS_TO_MILLIS) +
            (minutes * MINS_TO_MILLIS) +
            (seconds * SECS_TO_MILLIS) +
            milliseconds;
        return new Time(total);
    }

    /**
     * Copia os valores passados como parâmetro para uma nova instância de `Time`.
     * @param original O intervalo de tempo a ser copiado.
     * @returns Uma nova instância de `Time`.
     */
    static clone(original: Time): Time {
        return new Time(original._totalMilliseconds);
    }

    /**
     * Extrai os valores de Date (horas, minutos, segundos e milisegundos) para uma nova instância de `Time`
     * @param date A data de onde será extraída os valores.
     * @returns Uma nova instância de `Time`
     */
    static of(date: Date): Time {
        return Time.from(date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds());
    }

    /**
     * Faz o parse de uma string de tempo no formato padrão do C# `TimeSpan` e retorna uma instância de `Time`.
     * 
     * Suporta os formatos:
     * - `"hh:mm:ss"` (ex: "01:30:00")
     * - `"hh:mm:ss.fff"` para frações de segundo (ex: "01:30:00.500" representa 500ms).
     * @param timeString A string para formatar.
     * @returns Uma instância de `Time`. Retorna um `Time` de valor 0 se a string for vazia ou inválida.
     */
    static parse(timeString: string): Time {
        if (timeString === undefined || timeString === null || timeString.trim() === "") return new Time(0);

        const parts = timeString.split(':');
        const hours = Number(parts[0]) || 0;
        const minutes = Number(parts[1]) || 0;

        // A parte dos segundos pode conter milissegundos separados por um ponto (ex: "15.500")
        const secondsParts = (parts[2] || "0").split('.');
        const seconds = Number(secondsParts[0]) || 0;

        // ASP.NET trata a casa decimal como fração de um segundo.
        // ex: ".5" = 500ms, ".05" = 50ms.
        let milliseconds = 0;
        if (secondsParts[1]) {
            milliseconds = Math.round(parseFloat(`0.${secondsParts[1]}`) * 1000);
        }

        return Time.from(hours, minutes, seconds, milliseconds);
    }

    /**
     * Gera uma lista momentos incrementais a partir de um tempo início e até um tempo final.
     * @param step Intervalo entre cada momento
     * @param min Valor inicial da lista. É 00:00:00 quando vazio.
     * @param max Valor final da lista. É 23:59:59 quando vazio.
     * @returns Lista de instâncias de `Time`
     */
    static sequence(step: Time, min?: Time, max?: Time): Time[] {
        const start = min ?? Time.from(0, 0);
        const end = max ?? Time.from(23, 59, 59);
        const tempValues: Time[] = [];
        let current: Time = Time.clone(start);
        while (current.compareTo(end) !== 1) {
            tempValues.push(current);
            current = current.add(step);
        }
        return tempValues;
    }

    /**
     * Formata o intervalo de tempo para exibição de acordo com um padrão fornecido.
     * Caso o tempo seja negativo, um sinal de menos (`-`) será prefixado automaticamente.
     * 
     * **Formatos suportados:**
     * - `H`: Horas sem zero à esquerda (ex: "5")
     * - `HH`: Horas com zero à esquerda (ex: "05")
     * - `m`: Minutos sem zero à esquerda (ex: "9")
     * - `mm`: Minutos com zero à esquerda (ex: "09")
     * - `s`: Segundos sem zero à esquerda (ex: "2")
     * - `ss`: Segundos com zero à esquerda (ex: "02")
     * - `f`: Milissegundos com 1 dígito (ex: "5")
     * - `ff`: Milissegundos com 2 dígitos (ex: "05")
     * - `fff`: Milissegundos com 3 dígitos (ex: "050")
     * @param pattern O padrão de formatação (padrão: "HH:mm:ss").
     * @returns A string customizada.
     */
    format(pattern: string = "HH:mm:ss"): string {
        const absHours = Math.abs(this.hours);
        const absMinutes = Math.abs(this.minutes);
        const absSeconds = Math.abs(this.seconds);
        const absMilliseconds = Math.abs(this.milliseconds);

        const pad = (n: number, length: number = 2) => n.toString().padStart(length, '0');

        const result = pattern
            .replace(/HH/g, pad(absHours))
            .replace(/H/g, absHours.toString())
            .replace(/mm/g, pad(absMinutes))
            .replace(/m/g, absMinutes.toString())
            .replace(/ss/g, pad(absSeconds))
            .replace(/s/g, absSeconds.toString())
            .replace(/f/g, absMilliseconds.toString())
            .replace(/ff/g, pad(absMilliseconds, 2))
            .replace(/fff/g, pad(absMilliseconds, 3));

        return this.isNegative ? `-${result}` : result;
    }

    /**
     * Converte o intervalo de tempo para o formato de string suportado nativamente pelo C#.
     * Lida automaticamente com durações negativas, prefixando a string com '-'.
     * @returns Uma string no formato `"[C]hh:mm:ss"`. Se houver milissegundos, adiciona o sufixo fracionário: `"hh:mm:ss.fff"`.
     */
    toString(): string {
        const isNegative = this._totalMilliseconds < 0;
        
        // Usamos Math.abs para garantir que os componentes não fiquem com sinais de menos soltos (ex: -1:-30:00)
        const absHours = Math.abs(this.hours);
        const absMinutes = Math.abs(this.minutes);
        const absSeconds = Math.abs(this.seconds);
        const absMilliseconds = Math.abs(this.milliseconds);

        const pad = (n: number) => n.toString().padStart(2, '0');

        let result = `${isNegative ? '-' : ''}${pad(absHours)}:${pad(absMinutes)}:${pad(absSeconds)}`;

        // ASP.NET espera frações de segundo se existirem milissegundos
        if (absMilliseconds > 0) {
            const msPad = (n: number) => n.toString().padStart(3, '0');
            result += `.${msPad(absMilliseconds)}`;
        }

        return result;
    }

    /**
     * Interceptador nativo do JavaScript para serialização JSON.
     * 
     * Quando `JSON.stringify()` é chamado em um objeto que contém esta classe (ex: num payload de requisição HTTP),
     * este método é invocado automaticamente, garantindo que o back-end (ASP.NET) receba o formato de string exato que ele espera
     * para realizar o binding no `TimeSpan`.
     * @returns A string formatada pela função `toString()`.
     */
    toJSON(): string {
        return this.toString();
    }
}