/**
 * A generic state toggler that cycles through a sequence of values.
*/
export type Toggle<T> = {
    /** The current value of the toggle. */
    readonly value: T;
    /** Advances to the next value in the sequence and returns it. */
    readonly next: () => T;
    /** Reverts to the previous value in the sequence and returns it. */
    readonly previous: () => T;
};

/**
 * A specialized Toggle for boolean states.
*/
export type Switch = Toggle<boolean> & {
    /** Flips the current boolean state and returns the new value. */
    readonly flip: () => boolean;
};

export interface ToggleModule {
    /**
     * Creates a Toggle from a guaranteed non-empty array of options.
     * @param options A tuple ensuring at least one element is provided.
     * @param onChange Optional callback triggered whenever the value changes.
     * @returns A generic Toggle instance.
    */
   list<T>(options: [T, ...T[]], onChange?: (value: T) => void): Toggle<T>;
   
   /**
    * Creates a Toggle from a variadic list of arguments.
    * @param firstOption The initial starting value.
    * @param rest Subsequent values to cycle through.
    * @returns A generic Toggle instance.
   */
  list<T>(firstOption: T, ...rest: T[]): Toggle<T>;
  
  /**
   * Creates a boolean Switch toggle.
   * @param initial The starting boolean value (defaults to false).
   * @param onChange Optional callback triggered whenever the switch flips.
   * @returns A Switch instance.
  */
 switch(initial?: boolean, onChange?: (value: boolean) => void): Switch;
}

function listFactory<T>(first: T | [T, ...T[]], ...rest: any[]): Toggle<T> {

    let _values: T[];
    let _onChange: ((value: T) => void) | undefined;
    let _currentIndex = 0;
    
    // Safely parse arguments based on the invoked signature
    if (Array.isArray(first)) {
        _values = [...first];
        _onChange = typeof rest[0] === 'function' ? rest[0] : undefined;
    } else {
        _values = [first, ...rest as T[]];
    }
    
    if (_values.length === 0) {
        throw new Error("Trying to create an empty Toggle object");
    }
    
    function next(): T {
        _currentIndex = (_currentIndex + 1) % _values.length;
        const val = _values[_currentIndex];
        if (_onChange) _onChange(val);
        return val;
    }

    function previous(): T {
        _currentIndex = (_currentIndex - 1 + _values.length) % _values.length;
        const val = _values[_currentIndex];
        if (_onChange) _onChange(val);
        return val;
    }

    return {
        get value() { return _values[_currentIndex]; },
        next,
        previous,
    };
}

function switchFactory(initial: boolean = false, onChange?: (value: boolean) => void): Switch {
    let _current = initial;

    function flip(): boolean {
        _current = !_current;
        if (onChange) onChange(_current);
        return _current;
    }

    return {
        get value() { return _current; },
        flip,
        next: flip,
        previous: flip,
    };
}

export const Toggle: ToggleModule = {
    list: listFactory,
    switch: switchFactory,
};