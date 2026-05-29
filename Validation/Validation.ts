export type ValidationSeverity = "error" | "warning" | "info"

export type ValidationResult = {
    errors: ValidationError[];
    isValid: boolean;
}

export type ValidationError = {
    /** The error message */
    message: string;
    /** The name of the property */
    property?: string;
    /** The property value that caused the failure */
    attempted?: any;
    /** Custom state associated with the failure */
    state?: any;
    /** Custom severity level associated with the failure */
    severity: ValidationSeverity;
    /** Gets or sets the error code */
    code?: string;
}

export type Validation<T> = (entry: T) => ValidationResult;

export type ErrorLike = string | ValidationError;

const compose = <T>(...validations: Validation<T>[]): Validation<T> => (entry) => {
    const errors: ValidationError[] = [];
    for (const validate of validations) {
        const result = validate(entry);
        if (!result.isValid) {
            errors.push(...result.errors);
        }
    }
    return {
        isValid: errors.length === 0,
        errors
    };
};

const failure: (error: ErrorLike | ErrorLike[], ...errors: ErrorLike[]) => ValidationResult = (error, ...errors) => {
    function toError(msg: ErrorLike): ValidationError {
        return typeof msg === "string" ? { message: msg, severity: "error" } : msg;
    }
    let firstErrors;
    if (Array.isArray(error)) {
        if (error.length === 0) {
            throw new Error("Cannot create a failed validation result without errors");
        }
        firstErrors = error.map(toError);
    }
    else {
        firstErrors = [toError(error)];
    }
    return { 
        isValid: false, 
        errors: errors.length == 0 ? [...firstErrors] : [...firstErrors, ...errors.map(toError)],
    };
}

const success: () => ValidationResult = () => ({ errors: [], isValid: true });

const error = (
    message: string,
    property?: string,
    attempted?: any,
    state?: any,
    severity?: ValidationSeverity,
    code?: string)
    : ValidationError => ({
        message,
        property,
        attempted,
        state,
        severity: severity ?? "error",
        code,
    });




/**********************\
**     VALIDATORS     **
\**********************/

const emailRegex = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;

export const email: (customMessage?: string) => Validation<string> = (msg) => (entry) => {
  if (entry === null || entry === undefined) {
    return Validation.success();
  }
  if (emailRegex.test(entry)) {
    return Validation.success();
  }
  return Validation.failure(Validation.error(msg ?? "Formato inválido"));
};

export const field = <T extends object, K extends keyof T>(
    key: K,
    validator: Validation<T[K]>
): Validation<T> => (entry) => {
    // Gracefully handle undefined parent objects (let required() handle strictness)
    if (entry === null || entry === undefined) {
        return Validation.success();
    }

    const propertyValue = entry[key];
    const result = validator(propertyValue);

    if (result.isValid) {
        return result;
    }

    // Map errors to build the path chain (e.g., "parent.child.grandchild")
    const mappedErrors = result.errors.map(err => ({
        ...err,
        property: err.property ? `${String(key)}.${err.property}` : String(key),
        attempted: err.attempted !== undefined ? err.attempted : propertyValue,
    }));

    return Validation.failure(mappedErrors[0], ...mappedErrors.slice(1));
};

export const filter = <T>(predicate: (error: ValidationError) => boolean, ...validations: Validation<T>[]): Validation<T> => (entry) => {

    const allErrors: ValidationError[] = [];

    for (const validate of validations) {
        const result = validate(entry);
        if (!result.isValid) {
            const filteredErrors = result.errors.filter(predicate);
            allErrors.push(...filteredErrors);
        }
    }

    if (allErrors.length > 0) {
        return Validation.failure(allErrors);
    }

    return Validation.success();
};



export const first = <T>(...validations: Validation<T>[]): Validation<T> => (entry) => {
    for (const validate of validations) {
        const result = validate(entry);
        if (!result.isValid) {
            // Abort immediately and return only the first error from this specific failure
            return Validation.failure(result.errors[0]);
        }
    }
    return Validation.success();
};



export const forEach = <T>(validator: Validation<T>): Validation<T[]> => (entry) => {
    // Gracefully handle null/undefined or non-arrays. 
    // Use required() and notEmpty() prior to this if strictness is needed.
    if (entry === null || entry === undefined || !Array.isArray(entry)) {
        return Validation.success();
    }

    const allErrors: ValidationError[] = [];

    entry.forEach((item, index) => {
        const result = validator(item);
        
        if (!result.isValid) {
            // Map the errors to inject the array index into the property path
            const mappedErrors = result.errors.map(err => ({
                ...err,
                property: err.property ? `[${index}].${err.property}` : `[${index}]`,
                attempted: err.attempted !== undefined ? err.attempted : item,
            }));
            
            allErrors.push(...mappedErrors);
        }
    });

    if (allErrors.length > 0) {
        // Return all collected errors across the array
        return Validation.failure(allErrors);
    }

    return Validation.success();
};



export const inRange = (
  min?: number, 
  max?: number, 
  customMessage?: string
): Validation<number> => (entry) => {
  if (entry === null || entry === undefined || Number.isNaN(entry)) {
    return Validation.success();
  }

  const isTooSmall = min !== undefined && entry < min;
  const isTooLarge = max !== undefined && entry > max;

  if (!isTooSmall && !isTooLarge) {
    return Validation.success();
  }

  let defaultMsg = "Valor fora do limite permitido.";
  if (min !== undefined && max !== undefined) {
      defaultMsg = `O valor deve estar entre ${min} e ${max}.`;
  } else if (min !== undefined) {
      defaultMsg = `O valor deve ser no mínimo ${min}.`;
  } else if (max !== undefined) {
      defaultMsg = `O valor deve ser no máximo ${max}.`;
  }

  return Validation.failure(Validation.error(customMessage ?? defaultMsg));
};



const ipv4Regex = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:)((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;

export const ipAddress: (customMessage?: string) => Validation<string> = (msg) => (entry) => {
  // If the value doesn't exist, we return success so that a separate required() 
  // validator can handle empty states if necessary.
  if (entry === null || entry === undefined) {
    return Validation.success();
  }

  if (entry === "localhost" || ipv4Regex.test(entry) || ipv6Regex.test(entry)) {
    return Validation.success();
  }

  return Validation.failure(Validation.error(msg ?? "Formato de endereço IP inválido."));
};



export const length = <T extends string | unknown[]>(
  min?: number,
  max?: number,
  customMessage?: string
): Validation<T> => (entry) => {
  // Gracefully handle empty states. Let required() catch missing values.
  if (entry === null || entry === undefined) {
    return Validation.success();
  }

  const len = entry.length;
  const isTooShort = min !== undefined && len < min;
  const isTooLong = max !== undefined && len > max;

  if (!isTooShort && !isTooLong) {
    return Validation.success();
  }

  // Construct a sensible default message based on provided arguments
  let defaultMsg = "Tamanho inválido.";
  if (min !== undefined && max !== undefined) {
      defaultMsg = `O tamanho deve estar entre ${min} e ${max}.`;
  } else if (min !== undefined) {
      defaultMsg = `O tamanho mínimo é ${min}.`;
  } else if (max !== undefined) {
      defaultMsg = `O tamanho máximo é ${max}.`;
  }

  return Validation.failure(Validation.error(customMessage ?? defaultMsg));
};



export const noneOf = <T>(
    forbiddenValues: T[],
    customMessage?: string,
    equalityComparer?: ((left: T, right: T) => boolean)
): Validation<T> => (entry) => {
    if (entry === null || entry === undefined) {
        return Validation.success();
    }
    if (equalityComparer && !forbiddenValues.some(t => equalityComparer(entry, t))) {
        return Validation.success();
    }
    if (!forbiddenValues.includes(entry)) {
        return Validation.success();
    }
    const defaultMsg = `O valor não pode ser um dos seguintes: ${forbiddenValues.join(", ")}.`;
    return Validation.failure(
        Validation.error(customMessage ?? defaultMsg, undefined, entry, undefined, "error", "NONE_OF")
    );
};



export const notEmpty = <T extends string | unknown[]>(customMessage?: string): Validation<T> => (entry) => {
  // We don't check for null/undefined here. 
  // If the user wants to strictly require a value, they should compose required() with notEmpty().
  if (entry === null || entry === undefined) {
    return Validation.success();
  }

  let isEmpty = false;

  if (typeof entry === "string") {
    // Trimming ensures "   " is treated as empty, matching your legacy implementation
    isEmpty = entry.trim() === "";
  } else if (Array.isArray(entry)) {
    isEmpty = entry.length === 0;
  }

  if (isEmpty) {
    return Validation.failure(
      Validation.error(customMessage ?? "O campo não pode estar vazio.", undefined, entry, undefined, "error", "EMPTY")
    );
  }

  return Validation.success();
};



export const oneOf = <T>(
    allowedValues: T[],
    customMessage?: string,
    equalityComparer?: ((left: T, right: T) => boolean)
): Validation<T> => (entry: T) => {
    // Let required() handle null/undefined checks
    if (entry === null || entry === undefined) {
        return Validation.success();
    }

    if (equalityComparer && allowedValues.some(t => equalityComparer(entry, t))) {
        return Validation.success();
    }
    if (allowedValues.includes(entry)) {
        return Validation.success();
    }

    // Default message maps the array for a clear error
    const defaultMsg = `O valor deve ser um dos seguintes: ${allowedValues.join(", ")}.`;

    return Validation.failure(
        Validation.error(customMessage ?? defaultMsg, undefined, entry, undefined, "error", "NOT_ONE_OF")
    );
};



export const required = <T>(customMessage?: string): Validation<T> => (entry) => {
  if (entry === null || entry === undefined) {
    return Validation.failure(
      Validation.error(customMessage ?? "Campo obrigatório.", undefined, entry, undefined, "error", "REQUIRED")
    );
  }
  
  return Validation.success();
};



export const select = <T, V>(
    accessor: (entry: T) => V,
    validator: Validation<V>,
    pathName?: string // Optional name for error pathing in the UI
): Validation<T> => (entry) => {
    if (entry === null || entry === undefined) {
        return Validation.success();
    }

    const selectedValue = accessor(entry);
    const result = validator(selectedValue);

    if (result.isValid) {
        return result;
    }

    // If no pathName is provided, we just return the raw result
    if (!pathName) {
        return result; 
    }

    // Map errors using the provided pathName
    const mappedErrors = result.errors.map(err => ({
        ...err,
        property: err.property ? `${pathName}.${err.property}` : pathName,
        attempted: err.attempted !== undefined ? err.attempted : selectedValue,
    }));

    return Validation.failure(mappedErrors[0], ...mappedErrors.slice(1));
};






export const Validation = {
    error,
    success,
    failure,
    compose,

    email,
    field,
    filter,
    first,
    forEach,
    inRange,
    ipAddress,
    length,
    noneOf,
    notEmpty,
    oneOf,
    required,
    select,
};