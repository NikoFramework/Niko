import EventEmitter from "eventemitter3";
import FileSystem from "fs";
import _ from "lodash";
import Path from "path";

import { type Logger } from "winston";

export interface AdapterInterface {}

export abstract class Adapter {}

export class Connection extends EventEmitter {
  private logger!: Logger;
  private adapterCache!: Record<string, Connection.AdapterFileInformation>;
  private adapterPath!: string;

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

  private SaveAdapterHistory() {
    var outputStruct = Object.create({});
    Object.entries(this.adapterCache).forEach(([file, info]) => {
      outputStruct[file] = { fileStatus: info.fileStatus };
    });

    Niko.config.adapters = outputStruct;
  }

  public async LoadAdapters(path: string | undefined = Niko.config.adapterPath) {
    if (!path || !FileSystem.existsSync(path)) {
      if (!path) {
        this.logger.warning('Adapters directory does not exist! Changed to "<running-dir>/adapters/"');
      }

      path = Path.resolve(process.cwd(), "./adapters/");
    }

    this.adapterPath = Niko.config.adapterPath = path;

    var files = FileSystem.readdirSync(path, { withFileTypes: true }).filter(Boolean);
    var adapters = Niko.config.adapters || {};

    for (let index = 0; index < files.length; index++) {
      const { isFile, name } = files[index]!;

      if (!isFile()) {
        continue;
      }

      if (!name.match(/\.(js|ts)$/)) {
        continue;
      }

      var status = adapters[name]; // shallow copy
      if (status) {
        adapters[name]!.isExist = true;

        if (status.fileStatus == "disabled") {
          this.logger.debug("A adapter - %s is disabled!", name);
          continue;
        }

        adapters[name]!.currStatus = "waiting";

        this.logger.debug("Found a adapter - %s!", name);
      } else {
        adapters[name] = {
          isExist: true,
          fileStatus: "enabled",
          currStatus: "waiting",
        };

        this.logger.debug("A new adapter - %s is detected!", name);
      }
    }

    adapters = _.transform(adapters, (result, info, file) => {
      if (info.isExist) {
        result[file] = info;
      }
    });

    this.adapterCache = adapters;
    this.SaveAdapterHistory();

    var asyncList = new Array<Promise<void>>();
    Object.entries(this.adapterCache).forEach(([file]) => {
      asyncList.push(this.LoadAdapter(file));
    });

    await Promise.all(asyncList);
    this.adapterCache = _.transform(this.adapterCache, (result, info, file) => {
      result[file] = info;

      if (info.currStatus != "crashed") {
        result[file].currStatus = "running";
      }
    });

    this.emit(Connection.Events.AllAdapeterLoaded);
  }

  private ExtractAdapterModule(data: any) {
    if (typeof data != "object") {
      throw new Error("It isn't a correct struct of script module exported.");
    }

    if (!Object.hasOwn(data, "default")) {
      throw new Error("It hasn't default export! ");
    }

    if (Object.getPrototypeOf(data.default) != Adapter) {
      throw new Error("It is not a subclass from Adapter class.");
    }

    return data.default;
  }

  public async LoadAdapter(adapterFile: string) {
    var status = this.adapterCache[adapterFile]!;
    const adapterScript = Path.resolve(this.adapterPath, adapterFile);

    try {
      const module = await import(adapterScript);
      const adapter = this.ExtractAdapterModule(module);

      Niko.adapters.push(new adapter(/* todo? */));

      status.currStatus = "waiting";
      this.logger.debug("A adapter - %s has completely loaded, then waiting", adapterFile);
    } catch (error) {
      status.currStatus = "crashed";
      this.logger.error("A adapter - %s has crashed! because of %s .", adapterFile, (error as Error).message);
    }
  }
}

export namespace Connection {
  export enum Events {
    AllAdapeterLoaded = "connection.events.all_adapter_loaded"
  }

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
