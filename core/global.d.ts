import { Logger } from "@poppinss/cliui";
import { PluginManager } from "./plugin";
import { Config, ConfigStruct } from "./config";

declare global {
  var niko: {
    logger: Logger;
    config: { prototype: typeof Config } & ConfigStruct;
  };

  var globalLogger: Logger;

  type Pretty<T> = T extends object ? (T extends infer O ? { [K in keyof O]: Pretty<O[K]> } : never) : T;
}

export {};
