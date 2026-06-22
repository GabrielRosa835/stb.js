import {
    all,
    email, EMAIL_VALIDATION_ERROR_CODE,
    field,
    filter,
    first,
    forEach,
    inRange, IN_RANGE_VALIDATION_ERROR_CODE,
    ipAddress, IP_ADDRESS_VALIDATION_ERROR_CODE,
    length, LENGTH_VALIDATION_ERROR_CODE,
    noneOf, NONE_OF_VALIDATION_ERROR_CODE,
    notEmpty, NOT_EMTPY_VALIDATION_ERROR_CODE,
    oneOf, ONE_OF_VALIDATION_ERROR_CODE,
    required, REQUIRED_VALIDATION_ERROR_CODE,
    select,
} from "./Validators";

export type ValidatorComplement = {
    readonly CODE: string;
}

function withCode<T extends Function>(
    validator: T, 
    code: string
): T & ValidatorComplement {
    return Object.defineProperty(validator, 'CODE', {
        value: code,
        writable: false,
        enumerable: true
    }) as T & ValidatorComplement;
}

export type Validate = never;

export const Validate = {
    email: withCode(email, EMAIL_VALIDATION_ERROR_CODE),
    inRange: withCode(inRange, IN_RANGE_VALIDATION_ERROR_CODE),
    ipAddress: withCode(ipAddress, IP_ADDRESS_VALIDATION_ERROR_CODE),
    length: withCode(length, LENGTH_VALIDATION_ERROR_CODE),
    noneOf: withCode(noneOf, NONE_OF_VALIDATION_ERROR_CODE),
    notEmpty: withCode(notEmpty, NOT_EMTPY_VALIDATION_ERROR_CODE),
    oneOf: withCode(oneOf, ONE_OF_VALIDATION_ERROR_CODE),
    required: withCode(required, REQUIRED_VALIDATION_ERROR_CODE),

    all,
    filter,
    first,
    forEach,
    field,
    select,
} as const;