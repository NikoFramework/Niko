import { Client } from "onebot-client-next";

import { cliui } from "@poppinss/cliui";
import InitializeConfig from "./config.ts";
import InitializeTerminal from "./terminal.ts";
import InitializePluginManager from "./plugin_manager.ts";
import InitializePrettyFeedback from "./pretty_feedback.ts";

export const ui = cliui({ mode: "normal" });

InitializeConfig();

const client = new Client(1225763245, {
  websocket_address: config.websocket_address,
  accent_token: config.websocket_auth_token,
});

client.logger.logger = global['logger'] = ui.logger as any;

export default client;

InitializeTerminal();
await InitializePrettyFeedback();
await InitializePluginManager();
client.Start();