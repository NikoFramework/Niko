/**
 * 
 *           插件管理器
 * 
 */

import { Client, MessageEvent, TElements } from "onebot-client-next";

import fs from "node:fs/promises";
import path from "node:path";
import ShellParser from "shell-quote";

import client from ".";
import config from "Niko/config";

export default async () => PluginManager.Initialize();

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

  private unloadedList = new Set<string>();
  private loadedPluginMap = new Map<string, Plugin>();

  private static instance: PluginManager;
  private constructor() {
    this.LoadPlugins();
    this.EventProcessor();
  }

  private async LoadPlugins() {
    await fs.mkdir(PluginManager.PLUGIN_DIR, { recursive: true });
    const scriptList = await fs.readdir(PluginManager.PLUGIN_DIR, { withFileTypes: true });

    for (const script of scriptList) {
      if (script.isFile() && /\.(ts|js)$/.test(script.name)) {
        await this.loadPlugin(script.name);
      }
    }

    logger.info(`Loaded ${this.loadedPluginMap.size} plugin(s), failed ${this.unloadedList.size} plugin(s)`);
  }

  private async loadPlugin(fileName: string) {
    try {
      const script = await import(path.resolve(PluginManager.PLUGIN_DIR, fileName));

      if (!script.default || Object.getPrototypeOf(script.default) != Plugin) {
        logger.debug(
          `Failed to import plugin ${fileName}: The plugin hasn't default export or isn't a subclass of Plugin.`,
        );
        this.unloadedList.add(fileName);
        return;
      }

      const instance = new script.default() as PluginInstance;

      this.loadedPluginMap.set(fileName, instance);
      logger.success(`Loaded ${instance.PLUGIN_NAME} ${instance.PLUGIN_VERSION}`);
    } catch (error) {
      logger.debug(`Failed to import plugin ${fileName}: ${JSON.stringify(error)}`);
      this.unloadedList.add(fileName);
    }
  }

  public UnloadPlugin(pluginName: string) {
    this.loadedPluginMap.delete(pluginName);
  }

  private EventProcessor() {
    client.on("message.group.normal", this.GroupEventProcessor.bind(this));
  }

  private GroupEventProcessor(message: MessageEvent.TGroupMessageEvent) {
    const { group_id, message: msgBlocks, raw_message } = message;

    if (!this.IsValidMessage(msgBlocks) || !raw_message.startsWith(config().triggle_token)) {
      return;
    }

    const [command, ...args] = ShellParser.parse(raw_message.slice(config().triggle_token.length));

    this.loadedPluginMap.forEach((instance) => {
      instance.RegisteredCommand.get(command as string)?.callback.call(client, args, message);
    });
  }

  private IsValidMessage(blocks: TElements) {
    return typeof blocks === "string" || (Array.isArray(blocks) ? blocks[0]?.type === "text" : blocks.type === "text");
  }
}

export interface PluginInstance extends Plugin {
  PLUGIN_NAME: string;
  PLUGIN_VERSION: string;
  PLUGIN_AUTHOR?: string;
}

export type CommandCallback<T extends MessageEvent.TBaseEvent> = (
  this: Client,
  argument: ShellParser.ParseEntry[],
  message: T,
) => void;

export type PluginCommand<T extends MessageEvent.TBaseEvent> = {
  name: string;
  callback: CommandCallback<T>;
};

export class Plugin {
  protected registeredCommand = new Map<string, PluginCommand<any>>();

  get RegisteredCommand() {
    return this.registeredCommand;
  }

  constructor() {}

  protected RegisterCommand(info: PluginCommand<any>) {
    this.registeredCommand.set(info.name, info);
  }
}
