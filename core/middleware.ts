/**
 *
 *           插件中间件
 *
 */

import _ from "lodash";
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
    };
  }

  public Execute(Context: MessageContext) {
    let index = 0;

    const Next = () => {
      let Current = this.middlewareList[index++];

      if (Current) {
        try {
          if (!_.isFunction(Current)) {
            logger.warning(`The middleware is not a function at [array.${index}]. `);

            throw new Error("Jmp next. ");
          }

          return Current(Context, Next);
        } catch {
          return Next();
        }
      } else {
        return true;
      }
    };

    return Next();
  }
}

type MiddlewareCallback = (Context: MessageContext, Next: Function) => any;
