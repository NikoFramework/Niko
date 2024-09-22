export class Connection<T extends Connection.Types> {
  private type: T;
  private provider: Connection.ServiceProvider<T>;

  protected static $config: typeof generalConfig.Config.connection;

  public constructor() {
    Connection.$config = generalConfig.Config.connection;
    if (!Connection.$config)
  }
}

export namespace Connection {
  export type Types = "forward" | "reverse" | "http";

  export abstract class ServiceProvider<T extends Types> {
    private type: T;

    public constructor() {}

    public Send() {}
    public On(event: "data") {}
  }

  export namespace Providers {
    class WebsocketForward {}
  }
}
