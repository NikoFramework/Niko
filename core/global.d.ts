import { Logger } from "@poppinss/cliui";
import { PluginManager } from "./plugin_manager";

declare global {
  export type ConfigStruct = {
    websocket_address: string;
    websocket_auth_token: string;
    
    triggle_token: string;
  };

  var logger: Logger;
  var config: ConfigStruct;
  var plugin_manager: PluginManager;
}

export {};
