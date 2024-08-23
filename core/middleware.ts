/**
 *
 *           插件中间件
 *
 */

import { MessageContext } from "./native";

export default () => Middleware.Initialize();

export class Middleware {
  // Initialize single instance
  public static Initialize() {
    if (!Middleware.instance) {
      Middleware.instance = new Middleware();
    }

    return Middleware.instance;
  }

  public readonly middlewareList = new Array<MiddlewareCallback>();

  private static instance: Middleware;
  private constructor() {}

  public Patch(func: MiddlewareCallback) {
    const newLength = this.middlewareList.push(func);

    return () => {
      delete this.middlewareList[newLength - 1];
    }
  }

  public ExecMiddlewares(Context: MessageContext) {
    let index = 0;

    const Next = () => {
      let current = this.middlewareList[index++];

      if (current) {
        return current(Context, Next);
      } else {
        return true;
      }
    };

    return Next();
  }
}

type MiddlewareCallback = (Context: MessageContext, Next: Function) => any;
