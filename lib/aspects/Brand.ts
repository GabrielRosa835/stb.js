export type Brand<TOriginal, TGeneric = unknown> = TOriginal &
{
    readonly __brand: unique symbol;
    readonly __generic: TGeneric;
};
