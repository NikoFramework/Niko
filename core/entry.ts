/// <reference path="./defines/index.d.ts"/>

import _ from "lodash";
import { Logger } from "winston";

import packageJson from "../package.json";

import { Connection } from "$./connection";
import "$./global";
import { Config } from "$.utils";

export class EntryPoint {
  // Define common variable
  // Config
  public get config(): Partial<EntryPoint.StructConfig> {
    return this._config?.Config || {};
  }

  public set config(data: Partial<EntryPoint.StructConfig>) {
    _.merge(this._config?.Config, data);
  }

  // Define prototype
  public readonly Config: typeof Config = Config;
  /**
   * @deprecated prefer using
   * ```Niko.logger.child({modules: "something"})```
   */
  public readonly Logger: typeof Logger = Logger;

  // Define instance variabl
  private _config: Config<EntryPoint.StructConfig> | undefined;

  public constructor() {
    process.stdout.write(`
███╗   ██ ██ ██╗  ██╗██████╗
████╗  ██ ██ ██║ ██╔██╔═══██╗
██╔██╗ ██ ██ █████╔╝██║   ██║   ${packageJson.version}.Next
██║╚██╗██ ██ ██╔═██╗██║   ██║   By ${packageJson.author.name}
██║ ╚████ ██ ██║  ██╚██████╔  
╚═╝  ╚═══ ╚═ ╚═╝  ╚═╝╚═════╝   

`);

    this.#Initalize();
  }

  #Initalize() {
    this._config = Config.LoadConfig("./config/.toml");
  }
}

export namespace EntryPoint {
  export type StructConfig = {
    adapterPath: string;
    adapters: {
      [props: string]: Connection.AdapterFileInformation;
    };
  };
}

export interface EntryPointExports {
  config: Partial<EntryPoint.StructConfig>;

  readonly Config: typeof Config;
  readonly Logger: typeof Logger;
}

_.merge(global.Niko, new EntryPoint());

export default global.Niko;

import "$./connection";
