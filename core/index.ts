/**
 *
 *           框架入口
 *
 */

import { Client } from "onebot-client-next";

import { cliui, colors } from "@poppinss/cliui";

import config from "./config.ts";
import Terminal from "./terminal.ts";
// import InitializePluginManager from "./plugin_manager.ts";
import PrettyFeedback from "./pretty_feedback.ts";
import native, { GroupMessageContext } from "./native.ts";
import middleware from "./middleware.ts";

const logger = cliui({ mode: "normal" }).logger.useColors(colors.raw());

Object.defineProperty(global, "logger", {
  value: logger,
  writable: false,
  enumerable: true,
  configurable: true,
});

await Terminal(); // Initialize logger
await PrettyFeedback(); // Initialize headless browser

const client = new Client(config().account_id, {
  websocket_address: config().websocket_address,
  accent_token: config().websocket_auth_token,
});

// Has method as same as the console has.
client.logger.logger = global.logger as any;

export default client;

// await InitializePluginManager();
middleware();
native({
  Send: client.Send.bind(client),
  supportQuickHandle: true,
});

client.connection!.on("message", native().Receive.bind(native()));

client.Start();