/**
 * This d.ts file is an index file
 * that integrates all global declarations.
 */

/// <reference path="general.d.ts"/>
/// <reference path="logger.d.ts"/>

declare global {
  declare type PrettyStruct<T> = T extends infer O ? { [K in keyof O]: O[K] } : never;
}

export {};
