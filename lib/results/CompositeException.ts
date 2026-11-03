import { Exception } from "./Exception";

export class CompositeException extends Exception
{
    public static readonly Code = "COMPOSITE";
    public readonly innerErrors: Error[];

    public constructor (message?: string, errors: Error[] = [])
    {
        super(message, errors.length > 0 ? errors[0] : undefined, CompositeException.Code);
        this.innerErrors = errors;
    }
}
