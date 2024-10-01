/**
 * This d.ts file is an index file
 * that integrates all global declarations.
 */

/// <reference path="entry.d.ts"/>

declare global {
  declare type OneAndMore<T> = T | Array<T>
  declare type PrettyStruct<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
}

export {};
