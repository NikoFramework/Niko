import toml from "smol-toml";

import path from "node:path";
import FileSystem from "node:fs";

export default function InitializeConfig() {
  Config.Initialize();
}

export class Config {
  public static Initialize() {
    return new Config();
  }

  public static readonly CONFIG_FILE = path.resolve(process.cwd(), "config/bot.config.toml");

  private constructor() {
    this.ReloadConfig();

    FileSystem.watchFile(Config.CONFIG_FILE, (curr, last) => {
      if (curr.mtimeMs == last.mtimeMs) {
        return;
      }

      this.ReloadConfig();
    });
  }

  public ReloadConfig() {
    const data = FileSystem.readFileSync(Config.CONFIG_FILE).toString("utf8");
    global['config'] = toml.parse(data) as ConfigStruct;
  }
}
