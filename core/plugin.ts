/**
 *
 *           插件管理器
 *
 */

import fs from "node:fs/promises";
import path from "node:path";
import ShellParser from "shell-quote";

import _ from "lodash";
import client, { GroupMessageContext } from "Niko/native";
import config from "Niko/config";
import { OnebotStandard } from "./onebot_v11";

export default () => PluginManager.Initialize();

export class PluginManager {
  // Initialize single instance
  public static Initialize() {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }

    return PluginManager.instance;
  }

  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

  public static readonly PLUGIN_DIR = path.resolve(process.cwd(), "plugin");

  private readonly loadedMap = new Map<string, Plugin>();
  private readonly unloadedList = new Set<string>();

  private static instance: PluginManager;
  private constructor() {
    this.EventProcessor();
  }

  public async LoadPlugins() {
    const action = globalLogger.action(">>> Load Plugins");

    try {
      await fs.mkdir(PluginManager.PLUGIN_DIR, { recursive: true });
      const scriptList = await fs.readdir(PluginManager.PLUGIN_DIR, { withFileTypes: true });

      for (const script of scriptList) {
        if (!script.isFile() || !/\.(ts|js)$/.test(script.name)) {
          continue;
        }

        await this.LoadPlugin(script.name);
      }
    } catch (error) {
      action.failed(error as Error);
      return;
    }

    globalLogger.info(`Loaded ${this.loadedMap.size} plugin(s), failed ${this.unloadedList.size} plugin(s)`);
    action.succeeded();
  }

  public async LoadPlugin(fileName: string) {
    try {
      const script = await import(path.resolve(PluginManager.PLUGIN_DIR, "./" + fileName));

      if (!script.default || Object.getPrototypeOf(script.default) != Plugin) {
        globalLogger.error(
          `Failed to import plugin ${fileName}: The plugin hasn't default export or isn't a subclass of Plugin.`,
        );
        this.unloadedList.add(fileName);
        return;
      }

      const instance = new script.default() as PluginInstance;

      this.loadedMap.set(fileName, instance);
      globalLogger.success(`Loaded plugin ${instance.PLUGIN_NAME} ${instance.PLUGIN_VERSION}`);
    } catch (error) {
      this.unloadedList.add(fileName);
      globalLogger.error(`Failed to import plugin ${fileName}: ${JSON.stringify(error)}`);
    }
  }

  public UnloadPlugin(pluginName: string) {
    this.loadedMap.delete(pluginName);
  }

  private EventProcessor() {
    client().on("message.group", this.GroupEventProcessor.bind(this));
  }

  private GroupEventProcessor(message: Pretty<GroupMessageContext>) {
    const { message: messages, content } = message;

    if (!this.IsValidMessage(messages) || !content.startsWith(config().triggle_token)) {
      return;
    }

    const [command, ...args] = ShellParser.parse(content.slice(config().triggle_token.length));

    this.loadedMap.forEach((instance) => {
      instance.RegisteredCommand.get(command as string)?.callback.call(null, args, message);
    });
  }

  private IsValidMessage(blocks: OnebotStandard.Message) {
    if (_.isArray(blocks)) {
      if (typeof blocks?.[0] == "string") return true;

      if (blocks?.[0].type == "text") return true;

      return false;
    }

    if (typeof blocks == "string") return true;

    if (Object.hasOwn(blocks, "type")) return blocks.type == "text";

    return false;
  }
}

export interface PluginInstance extends Plugin {
  PLUGIN_NAME: string;
  PLUGIN_VERSION: string;
  PLUGIN_AUTHOR?: string;
}

export type CommandCallback = (argument: ShellParser.ParseEntry[], message: any) => void;

export type PluginCommand = {
  name: string;
  callback: CommandCallback;
};

export class Plugin {
  protected registeredCommand = new Map<string, PluginCommand>();

  get RegisteredCommand() {
    return this.registeredCommand;
  }

  constructor() {}

  protected RegisterCommand(info: PluginCommand) {
    this.registeredCommand.set(info.name, info);
  }
}
