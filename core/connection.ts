import { type Logger } from "winston";

export interface ConnectionOptions {
  provider: OneAndMore<Connection.ServiceProvider>
}

export class Connection<T extends Connection.Types> {
  private type: T;
  private provider: Connection.ServiceProvider;

  public static $logger: Logger;
  public static $config: NonNullable<typeof generalConfig.Config.connection>;

  public constructor(options: ConnectionOptions) {
    Connection.$logger = logger.child({ modules: ["module", "logger"] });
    Connection.$config = generalConfig.Config.connection!;
    
    if (!Connection.$config) {
      Connection.$logger.error("Incorrect initialization! Config module haven't inited yet!");
    }
  }
}

export namespace Connection {
  export enum Types {
    Forward, Reverse, Http, Other
  }

  export abstract class ServiceProvider {
    public readonly type: symbol;

    public constructor(private _initialType: Types) {
      this["type"] = Symbol(_initialType);
    }
  }

  export namespace Providers {
    class WebsocketForward extends ServiceProvider {
      public constructor() {
        super(Types.Forward);
      }
    }
  }
}
