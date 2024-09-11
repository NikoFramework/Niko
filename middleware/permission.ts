import { Dispose, Middleware, MiddlewareCallback, MiddlewareInstance } from "Niko/middleware";

export default class extends Middleware implements MiddlewareInstance {
  public MIDDLEWARE_NAME = "Permission";
  public MIDDLEWARE_AUTHOR = "Kamenomi";
  public MIDDLEWARE_VERSION = "0.0.1";

  public constructor(patch: (func: MiddlewareCallback) => Dispose) {
    super();

    patch((context, next) => {
      return next();
    });
  }
}
