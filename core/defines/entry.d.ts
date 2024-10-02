import { type Logger } from "winston";

import { type ConnectionExports } from "$./connection";
import { type EntryPointExports } from "$./entry";

declare global {
  declare type Niko = EntryPointExports &
  ConnectionExports & {
      logger: Logger;

      adapters: Array<Adapter>;
    };

  var Niko: Niko;
}

export {};
