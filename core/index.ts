/**
 *
 *           框架入口
 *
 */

import { Client } from "onebot-client-next";

import { cliui } from "@poppinss/cliui";

import config, { Config } from "./config.ts";
import Utils from "./utils.ts";
import Native from "./native.ts";
import Terminal from "./terminal.ts";
import PluginManager from "./plugin.ts";
import MiddlewareManager from "./middleware.ts";
import PrettyFeedback from "./pretty_feedback.ts";

const logger = cliui({ mode: "normal" }).logger;
logger.debug = () => {};

global["globalLogger"] = logger;

global["niko"] = {
  logger: logger,
  config: {
    prototype: Config,
    ...config(),
  },
};

Utils.LockObjectProperty(global, "niko");

Terminal(); // Initialize logger
await PrettyFeedback(); // Initialize headless browser

const client = new Client(niko.config.account_id, {
  websocket_address: niko.config.websocket_address,
  accent_token: niko.config.websocket_auth_token,
});

// Has method as same as the console has.
client.logger.logger = globalLogger as any;

export default client;

const Nt = Native({
  Send: client.Send.bind(client),
  supportQuickHandle: false,
});

await MiddlewareManager().LoadMiddlewares();
await PluginManager().LoadPlugins();

await client.Start();
client.connection!.on("message", Nt.Receive.bind(Nt));
