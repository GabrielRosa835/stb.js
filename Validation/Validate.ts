import { Validation, ValidationError } from "./Validation";


const ERROR_CODES = {
    EMAIL: "VALIDATION_EMAIL",
    FIELD: "VALIDATION_FIELD",
    FILTER: "VALIDATION_FILTER",
    FIRST: "VALIDATION_FIRST",
    FOR_EACH: "VALIDATION_FOR_EACH",
    IN_RANGE: "VALIDATION_IN_RANGE",
    IP_ADDRESS: "VALIDATION_IP_ADDRESS",
    LENGTH: "VALIDATION_LENGTH",
    NONE_OF: "VALIDATION_NONE_OF",
    NOT_EMTPY: "VALIDATION_NOT_EMTPY",
    ONE_OF: "VALIDATION_ONE_OF",
    REQUIRED: "VALIDATION_REQUIRED",
    SELECT: "VALIDATION_SELECT",
}


// COMPOSITE VALIDATORS


const all: <T>(...validations: Validation<T>[]) => Validation<T> = (...validators) => (entry) => {
    const errors: ValidationError[] = [];
    for (const validate of validators) {
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


const filter = <T>(predicate: (error: ValidationError) => boolean, ...validations: Validation<T>[]): Validation<T> => (entry) => {
    
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


const first = <T>(...validations: Validation<T>[]): Validation<T> => (entry) => {
    for (const validate of validations) {
        const result = validate(entry);
        if (!result.isValid) {
            // Abort immediately and return only the first error from this specific failure
            return Validation.failure(result.errors[0]);
        }
    }
    return Validation.success();
};


// STRING VALIDATORS
// Obs: some array validators may be also considered string balidators, 
// especially when they overlap as string being an array of characters


const EMAIL_REGEX = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;

const email: (customMessage?: string) => Validation<string> = (msg) => (entry) => {
    if (entry === null || entry === undefined) {
        return Validation.success();
    }
    if (EMAIL_REGEX.test(entry)) {
        return Validation.success();
    }
    return Validation.failure(Validation.error(msg ?? "Formato inválido"));
};


const IPV4_REGEX = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
const IPV6_REGEX = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:)((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;

const ipAddress: (customMessage?: string) => Validation<string> = (msg) => (entry) => {
  // If the value doesn't exist, we return success so that a separate required() 
  // validator can handle empty states if necessary.
  if (entry === null || entry === undefined) {
    return Validation.success();
  }

  if (entry === "localhost" || IPV4_REGEX.test(entry) || IPV6_REGEX.test(entry)) {
    return Validation.success();
  }

  return Validation.failure(Validation.error(msg ?? "Formato de endereço IP inválido."));
};


// OBJECT VALIDATORS


const field = <T extends object, K extends keyof T>(
    key: K,
    validator: Validation<T[K]>,
    customMessage?: string
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
        message: customMessage ? customMessage : err.message,
        property: err.property ? `${String(key)}.${err.property}` : String(key),
        attempted: err.attempted !== undefined ? err.attempted : propertyValue,
    }));

    return Validation.failure(mappedErrors[0], ...mappedErrors.slice(1));
};


const select = <T, V>(
    accessor: (entry: T) => V,
    validator: Validation<V>,
    customMessage?: string,
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
        message: customMessage ? customMessage : err.message,
        property: err.property ? `${pathName}.${err.property}` : pathName,
        attempted: err.attempted !== undefined ? err.attempted : selectedValue,
    }));

    return Validation.failure(mappedErrors[0], ...mappedErrors.slice(1));
};


// ARRAY VALIDATORS
// Obs: some string validators may be also considered array validators, 
// especially when they overlap as string being an array of characters

const forEach = <T>(validator: Validation<T>, customMessage?: string): Validation<T[]> => (entry) => {
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
                message: customMessage ? customMessage : err.message,
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


const length = <T extends string | unknown[]>(
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


const notEmpty = <T extends string | unknown[]>(customMessage?: string): Validation<T> => (entry) => {
  // We don't check for null/undefined here. 
  // If the user wants to strictly require a value, they should compose required() with notEmpty().
  if (entry === null || entry === undefined) {
    return Validation.success();
  }

  let isEmpty = false;

  if (typeof entry === "string") {
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


// NUMBER VALIDATORS


const inRange = (
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


// GENERIC VALIDATORS


const noneOf = <T>(
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


const oneOf = <T>(
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


const required = <T>(customMessage?: string): Validation<T> => (entry) => {
  if (entry === null || entry === undefined) {
    return Validation.failure(
      Validation.error(customMessage ?? "Campo obrigatório.", undefined, entry, undefined, "error", "REQUIRED")
    );
  }
  
  return Validation.success();
};


export const Validate = {
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