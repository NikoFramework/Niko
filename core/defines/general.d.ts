import { type Config } from "$.utils/config";
import { type Connection } from "$./connection";

declare global {
  declare type TGeneralConfig = {
    general: {
      bot_id: number;
    };

    connection: {
      type: Connection.Types;
      access_token: string;
      server_address: string;
      http: {
        provider_port: number;
      };
      websocket_reverse: {
        provider_port: number;
      };
    };
  };

  var generalConfig: Config<TGeneralConfig>;
}

export {};
