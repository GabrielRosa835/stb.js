/**
 * Tipos básicos aceitos como retorno válido em um processo de serialização JSON.
 */
export type Serializable = 
  | string 
  | number 
  | boolean 
  | null 
  | { [key: string]: Serializable } 
  | Serializable[];