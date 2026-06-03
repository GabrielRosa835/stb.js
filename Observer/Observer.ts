export type Listener<T> = (data: T) => void;
export type Unsubscribe = () => void;
export type EqualityComparer<T> = (left: T, right: T) => boolean;

export type ObserverOptions<T> = {
    /** * If true, acts like a BehaviorSubject. New subscribers will immediately 
     * be called with the last notified value upon subscription.
     */
    emitLastValueOnSubscribe?: boolean;
    
    /** The initial value to emit if `emitLastValueOnSubscribe` is true. */
    initialValue?: T;
    
    /** * If true, the observer will ignore `notify` calls where the new value 
     * is equal to the current value. 
     */
    notifyOnlyIfDistinct?: boolean;
    
    /** * Custom function to determine equality. 
     * Ignored if `distinctUntilChanged` is false or undefined.
     * Defaults to `Object.is` for strict reference equality.
     */
    equalityComparer?: EqualityComparer<T>;
};

export type Observer<T> = {
    subscribe: (listener: Listener<T>) => Unsubscribe;
    notify: (data: T) => void;
    clear: () => void;
    readonly currentValue: T | undefined;
    readonly subscriberCount: number;
};

function createObserver<T>(options?: ObserverOptions<T>): Observer<T> {
    const listeners: Set<Listener<T>> = new Set();
    let _currentValue: T | undefined = options?.initialValue;

    // Default to strict equality if no custom comparer is provided
    const comparer = options?.equalityComparer ?? Object.is;

    const subscribe = (listener: Listener<T>): Unsubscribe => {
        listeners.add(listener);
        if (options?.emitLastValueOnSubscribe && _currentValue !== undefined) {
            listener(_currentValue);
        }
        return () => listeners.delete(listener);
    };

    const notify = (data: T): void => {
        // Drops the notification if notifyOnlyIfDistinct is enabled and values are equal
        if (options?.notifyOnlyIfDistinct && comparer(_currentValue as T, data)) {
            return;
        }
        _currentValue = data;
        listeners.forEach((listener) => listener(data));
    };

    const clear = (): void => listeners.clear();

    return {
        subscribe,
        notify,
        clear,
        get currentValue() {
            return _currentValue;
        },
        get subscriberCount() {
            return listeners.size;
        }
    };
}

export const Observer = {
    create: createObserver,
}