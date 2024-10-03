import EventEmitter from "eventemitter3";
import FileSystem from "fs";
import _ from "lodash";
import Path from "path";

import { type Logger } from "winston";

export interface AdapterInterface {}

export abstract class Adapter {}

export class Connection extends EventEmitter {
  private logger!: Logger;
  private adapters!: Record<string, Connection.AdapterFileInformation>;

  public constructor() {
    super();
    this.#Initialize();
  }

  #Initialize() {
    this.logger = Niko.logger.child({ modules: "Connection" });

    Object.defineProperty(global.Niko, "adapters", new Array<Adapter>());

    global.Niko.LoadAdapter = this.LoadAdapter.bind(this);
    global.Niko.LoadAdapters = this.LoadAdapters.bind(this);

    this.LoadAdapters();
  }

  private SaveAdapters() {
    var outputStruct = Object.create({});
    Object.entries(this.adapters).forEach(([file, info]) => {
      outputStruct[file] = { fileStatus: info.fileStatus };
    });

    Niko.config.adapters = outputStruct;
  }

  public LoadAdapters(path?: string) {
    if (!path || !FileSystem.existsSync(path)) {
      if (!path) {
        this.logger.warning('Adapters directory does not exist! Changed to "<running-dir>/adapters/"');
      }

      path = Path.resolve(process.cwd(), "./adapters/");
    }

    var files = FileSystem.readdirSync(path, { withFileTypes: true }).filter(Boolean);
    var adapters = Niko.config.adapters || {};

    for (let index = 0; index < files.length; index++) {
      const file = files[index]!;

      if (!file.isFile()) {
        continue;
      }

      if (!file.name.match(/\.(js|ts)$/)) {
        continue;
      }

      var status = adapters[file.name]; // shallow copy
      if (status) {
        adapters[file.name]!.isExist = true;
        
        if (status.fileStatus == "disabled") {
          this.logger.debug("A adapter - %s is disabled!", file.name);
          continue;
        }

        adapters[file.name]!.currStatus = "waiting";

        this.logger.debug("Found a adapter - %s!", file.name);
      } else {
        adapters[file.name] = {
          isExist: true,
          fileStatus: "enabled",
          currStatus: "waiting",
        };

        this.logger.debug("A new adapter - %s is detected!", file.name);
      }

      adapters = _.transform(adapters, (result, info, file) => {
        if (info.isExist) {
          result[file] = info;
        }
      });

      this.adapters = adapters;
      this.SaveAdapters();
    }
  }

  public LoadAdapter(adapterScript: string) {}
}

export namespace Connection {
  export enum AdapterFileStatus {
    enabled,
    disabled,
  }

  export enum AdapterCurrStatus {
    running,
    crashed,
    waiting,
    exited,
  }

  export type AdapterFileInformation = {
    fileStatus: keyof typeof AdapterFileStatus;

    /**
     * @private internal variable.
     */
    currStatus: keyof typeof AdapterCurrStatus;
    /**
     * @private internal variable.
     */
    isExist: boolean;
  };
}

export interface ConnectionExports {
  adapters: Array<Adapter>;

  /**
   * LoadApaters - via directory
   */
  LoadAdapters: (path?: string) => void;

  /**
   * LoadAdapter
   * @param adapterScript 适配器原型类
   */
  LoadAdapter: (adapterScript: string) => void;
}

export default new Connection();
