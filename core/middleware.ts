/**
 *
 *           插件中间件
 *
 */

import { MessageContext } from "./native";

import _ from "lodash";
import fs from "node:fs/promises";
import path from "node:path";

export default () => MiddlewareManager.Initialize();

export class MiddlewareManager {
  // Initialize single instance
  public static Initialize() {
    if (!MiddlewareManager.instance) {
      MiddlewareManager.instance = new MiddlewareManager();
    }

    return MiddlewareManager.instance;
  }

  public static readonly MIDDLEWARE_DIR = path.resolve(process.cwd(), "middleware");

  public readonly middlewareList = new Array<MiddlewareCallback>();
  private readonly loadedMap = new Map<string, Middleware>();
  private readonly unloadedList = new Set<string>();

  public static instance: MiddlewareManager;
  private constructor() {
  }

  public async LoadMiddlewares() {
    const action = globalLogger.action(">>> Load Middlewares");

    try {
      await fs.mkdir(MiddlewareManager.MIDDLEWARE_DIR, { recursive: true });
      const middlewareList = await fs.readdir(MiddlewareManager.MIDDLEWARE_DIR, { withFileTypes: true });

      for (const script of middlewareList) {
        if (script.isFile() && /\.(ts|js)$/.test(script.name)) {
          await this.LoadMiddleware(script.name);
        }
      }
    } catch (error) {
      action.failed(error as Error);
      return;
    }

    globalLogger.info(`Loaded ${this.loadedMap.size} middleware(s), failed ${this.unloadedList.size} middleware(s)`);
    globalLogger.info(`Total middlware function(s): ${this.middlewareList.length}. `);
    action.succeeded();
  }

  public async LoadMiddleware(fileName: string) {
    try {
      const script = await import(path.resolve(MiddlewareManager.MIDDLEWARE_DIR, "./" + fileName));

      if (!script.default || Object.getPrototypeOf(script.default) != Middleware) {
        globalLogger.error(
          `Failed to import middleware ${fileName}: The middleware hasn't default export or isn't a subclass of middleware.`,
        );
        this.unloadedList.add(fileName);
        return;
      }

      const instance = new script.default(this.Patch.bind(this)) as MiddlewareInstance;

      this.loadedMap.set(fileName, instance);
      globalLogger.success(`Loaded middleware ${instance.MIDDLEWARE_NAME} ${instance.MIDDLEWARE_VERSION}`);
    } catch (error) {
      this.unloadedList.add(fileName);
      globalLogger.error(`Failed to import middleware ${fileName}: ${JSON.stringify(error)}`);
    }
  }

  public UnloadMiddleware(middlewareName: string) {
    this.loadedMap.delete(middlewareName);
  }

  public Patch(func: MiddlewareCallback) {
    const newLength = this.middlewareList.push(func);

    globalLogger.debug("A new middleware has loaded. ");

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
            globalLogger.warning(`The middleware is not a function at [array.${index}]. `);

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

export type MiddlewareCallback = (Context: MessageContext, Next: Function) => any;
export type Dispose = () => void;

export interface MiddlewareInstance extends Middleware {
  MIDDLEWARE_NAME: string;
  MIDDLEWARE_VERSION: string;
  MIDDLEWARE_AUTHOR?: string;
}

export class Middleware {
  public constructor() {}
}
