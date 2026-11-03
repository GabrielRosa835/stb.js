import { AsyncDisposable } from "./AsyncDisposable";
import { Disposable } from "./Disposable";

export namespace Disposal
{
    export function isDisposable(value: unknown): value is Disposable
    {
        return typeof value === "object" && value !== null && typeof (value as Disposable).dispose === "function";
    }
    
    export function isAsyncDisposable(value: unknown): value is AsyncDisposable
    {
        return typeof value === "object" && value !== null && typeof (value as AsyncDisposable).disposeAsync === "function";
    }

    export function dispose(disposable: unknown): void
    {
        if (isDisposable(disposable))
        {
            disposable.dispose();
        }
    }

    export async function disposeAsync(disposable: unknown): Promise<void>
    {
        if (isAsyncDisposable(disposable))
        {
            await disposable.disposeAsync();
        }
        else if (isDisposable(disposable))
        {
            disposable.dispose();
        }
    }
}