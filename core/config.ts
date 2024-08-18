/**
 * 
 *           配置类
 * 
 */

import toml from "smol-toml";
import path from "node:path";
import FileSystem from "node:fs";

export default () => Config.Initialize();

export type ConfigStruct = {
  websocket_address: string;
  websocket_auth_token: string;

  triggle_token: string;
};

export class Config {
  // Initialize single instance
  public static Initialize() {
    if (!Config.instance) {
      Config.instance = new Config();
    }

    return Object.assign(Config.instance, { ...Config.instance.data });
  }

  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

  private configFile = path.resolve(process.cwd(), "config/bot.config.toml");

  private data = {} as ConfigStruct;

  private static instance: Config;
  private constructor(file?: string) {
    this.configFile = file ?? this.configFile;

    this.LoadConfig();

    FileSystem.watchFile(this.configFile, (curr, last) => {
      if (curr.mtimeMs == last.mtimeMs) {
        return;
      }

      this.LoadConfig();
    });
  }

  public From(configFile: string) {
    return new Config(configFile);
  }

  public LoadConfig() {
    try {
      const rawData = FileSystem.readFileSync(this.configFile).toString("utf8");
      this.data = toml.parse(rawData) as ConfigStruct;
    } catch {
      logger.error("Invalid format of config file. Shall we try again? ");
    }
  }
}
