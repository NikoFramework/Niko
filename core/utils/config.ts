import TOML from "smol-toml";

import fs, { Stats } from "node:fs";

export class Config<O extends object = any, T = Partial<O>> {
  private static logger = logger.child({ modules: ["utils", "config"] });

  private fileExt: string;
  private cache = {} as T;

  public static LoadConfig(file: string) {
    return new Config(file);
  }

  get Config() {
    return this.cache;
  }

  set Config(struct: T) {
    var text;

    switch (this.fileExt) {
      case "json":
        text = JSON.stringify(struct);
        break;
      case "toml":
        text = TOML.stringify(struct);
        break;
      default:
        Config.logger.warn(
          "The config file (%s) has unsupport extension (%s)! It will not force to save. ",
          this.file,
          this.fileExt
        );
        break;
    }

    if (text) {
      fs.writeFileSync(this.file, text);
    }
  }

  private constructor(private file: string) {
    this.fileExt = file.match(/\.([^\.]+)$/)?.[1]?.toLowerCase() || "text";

    this._OnReload();
    fs.watchFile(file, this._OnReload.bind(this));
  }

  public Close() {
    return fs.unwatchFile(this.file);
  }

  private _OnReload(curr?: Stats, prev?: Stats) {
    if (arguments.length != 0 && curr?.mtimeMs == prev?.mtimeMs) return;

    const text = fs.readFileSync(this.file).toString();
    switch (this.fileExt) {
      case "json":
        this.cache = JSON.parse(text) as T;
        break;
      case "toml":
        this.cache = TOML.parse(text) as T;
        break;
      default:
        this.cache = {} as T;
        Config.logger.warn(
          "The config file (%s) has unsupport extension (%s)! It will not change. ",
          this.file,
          this.fileExt
        );
        break;
    }
  }
}
