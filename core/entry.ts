/// <reference path="./defines/index.d.ts"/>

import packageJson from "../package.json";

import _ from "lodash";
import { createLogger, format, Logger, transports } from "winston";

import { Config } from "$.utils";

export namespace EntryPoint {
  export type StructConfig = {};
}

class EntryPoint {
  // Define common variable
  public logger!: Logger & { prototype: typeof Logger };
  public config!: Partial<EntryPoint.StructConfig> & { prototype: typeof Config };

  // Define prototype variable
  public readonly Logger: typeof Logger = Logger;
  public readonly Config: typeof Config = Config;

  // Define instance variabl
  private _config!: Config<EntryPoint.StructConfig>;

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
    this.#InitializeLogger();

    this._config = Config.LoadConfig("./config/.toml");
    Object.defineProperty(this.config, "prototype", {
      configurable: true,
      enumerable: true,
      writable: false,
      get: () => Config,
    });
    this.FlushConfig();
  }

  #InitializeLogger() {
    const { combine, colorize, printf, uncolorize, timestamp } = format;

    this.logger = createLogger({
      defaultMeta: { projectName: "NikoNext" },
      level: "info",
      format: combine(
        colorize(),
        timestamp(),
        printf(({ level, message, modules, projectName, timestamp }) => {
          var label = projectName as string;

          const type = typeof modules;
          if (type == "string") {
            label = [projectName, modules].join(".");
          }

          if (Array.isArray(modules)) {
            label = [projectName, ...modules].map((val) => val || "<???>").join(".");
          }

          return `${timestamp} [${label}] ${level}: ${message}`;
        })
      ),
      transports: [
        new transports.Console({ handleExceptions: true, handleRejections: true }),
        new transports.File({
          filename: `./logs/${new Date().valueOf()}.log`,
          format: uncolorize(),
          handleExceptions: true,
          handleRejections: true,
        }),
      ],
    }) as any;

    Object.defineProperty(this.logger, "prototype", {
      configurable: true,
      enumerable: true,
      writable: false,
      get: () => Logger,
    });
  }

  public FlushConfig() {
    return _.merge(this.config, this._config.Config);
  }
}

const instance = new EntryPoint();
Object.defineProperty(global, "Niko", {
  configurable: true,
  enumerable: true,
  writable: false,
  value: instance,
});
export default instance;

import "$./connection";