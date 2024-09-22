import { type Logger } from "winston";

export class Connection<T extends Connection.Types> {
  private type: T;
  private provider: Connection.ServiceProvider<T>;

  public static $logger: Logger;
  public static $config: NonNullable<typeof generalConfig.Config.connection>;

  public constructor() {
    Connection.$logger = logger.child({ modules: ["module", "logger"] });
    Connection.$config = generalConfig.Config.connection!;

    if (!Connection.$config) {
      Connection.$logger.error("Incorrect initialization! Config module haven't inited yet!");
    }
  }
}

export namespace Connection {
  export type Types = "forward" | "reverse" | "http" | "other";

  export abstract class ServiceProvider<T extends Types = "other"> {
    public symbol: symbol;

    // bad declare.
    protected type: T = "other" as T;
    protected config: typeof Connection.$config;

    public constructor() {
      this.config = Connection.$config;
      this.symbol = Symbol(this.type);
    }

    public Send() {}
    public On(event: "data") {}
  }

  export namespace Providers {
    class WebsocketForward extends ServiceProvider<"forward"> {
      public constructor() {
        super();
        this.type
      }
    }
  }
}
