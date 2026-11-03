export class Exception extends Error
{
    public readonly code?: string;
    public readonly innerError?: Error;

    public constructor (message?: string, inner?: Error, code?: string)
    {
        super(message);
        this.code = code;
        this.innerError = inner;
    }
}