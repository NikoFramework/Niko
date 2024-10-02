import EventEmitter from "eventemitter3";
import FileSystem from "fs";
import Path from "path";

import { type Logger } from "winston";

export interface AdapterInterface {}

export abstract class Adapter {}

export class Connection extends EventEmitter {
  private logger!: Logger;

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

  public LoadAdapters(path?: string) {
    if (!path || !FileSystem.existsSync(path)) {
      if (!path) {
        this.logger.warning('Adapters directory does not exist! Changed to "<running-dir>/adapters/"');
      }

      path = Path.resolve(process.cwd(), "./adapters/");
    }

    var files = FileSystem.readdirSync(path, { withFileTypes: true }).filter(Boolean);
    var adapterList = Niko.config.adapters || {};

    for (let index = 0; index < files.length; index++) {
      const file = files[index]!;

      if (!file.isFile()) {
        continue;
      }

      if (!file.name.match(/\.(js|ts)$/)) {
        continue;
      }

      var status = adapterList[file.name];
      if (status) {
        if (status.fileStatus == "disabled") {
          this.logger.debug("A adapter - %s is disabled!", file.name);
          continue;
        }

        adapterList[file.name]!.currStatus = "waiting";

        this.logger.debug("Found a adapter - %s!", file.name);
      } else {
        adapterList[file.name] = {
          fileStatus: "enabled",
          currStatus: "waiting",
        };

        this.logger.debug("A new adapter - %s is detected!", file.name);
      }
    }
  }

  public LoadAdapter(adapter: Adapter) {}
}

export interface ConnectionExports {
  adapters: Array<Adapter>;

  /**
   * LoadApaters - via directory
   */
  LoadAdapters: (path?: string) => void;

  /**
   * LoadAdapter
   * @param adapter 适配器原型类
   */
  LoadAdapter: (adapter: Adapter) => void;
}

export default new Connection();
