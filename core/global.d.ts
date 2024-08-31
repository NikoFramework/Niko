import { Logger } from "@poppinss/cliui";
import { PluginManager } from "./plugin_manager";

declare global {
  var logger: Logger;

  type Pretty<T> = T extends object
  ? T extends infer O ? { [K in keyof O]: Pretty<O[K]> } : never
  : T;
}

export {};
