/**
 * 框架核心
 * 将所有来自 Client 的数据处理再将一并输出。
 */

/// <reference path="onebot_v11.d.ts" />
import { OnebotStandard } from "./onebot_v11";
import EventEmitter from "eventemitter3";
import middleware from "./middleware";

export default (constructor?: NativeConstructor) => Native.Initialize(constructor!);

export type NativeConstructor = {
  supportQuickHandle: boolean;
  Send(...args: any): void;
};

export class Native extends EventEmitter<keyof Events> {
  public static Initialize(constructor: NativeConstructor) {
    if (!Native.instance) {
      Native.instance = new Native(constructor);
    }

    return Native.instance;
  }

  // private connection: WebSocket;

  private supportQuickHandle: boolean;

  private static instance: Native;
  private constructor(constructor: NativeConstructor) {
    super();
    // this.connection = new WebSocket.WebSocketServer({});

    this.supportQuickHandle = constructor.supportQuickHandle;
    this.Send = constructor.Send;
  }

  public CallApi<T extends keyof OnebotStandard.Apis, R extends OnebotStandard.Apis[T]>(
    action: T,
    ...args: Parameters<R>
  ): Promise<ReturnType<R>> {
    const timestamp = new Date().getTime(); // _.uniqueId(`CallApi.${action}.`);
    const params = args.at(0) || {};

    return new Promise<any>((resolve, reject) => {
      var messageHandler = (data: OnebotStandard.ApiResponse) => {
        if (data.echo !== timestamp) {
          return;
        }

        if (data.status === "ok") {
          resolve(data.data);
        } else {
          reject(data);
        }

        this.off(".native_data", messageHandler);
      };

      this.on(".native_data", messageHandler);
      this.Send({ action, params, echo: timestamp });
      logger.debug(JSON.stringify({ action, params, echo: timestamp }));
    });
  }

  public QuickCallApi(context: object, operation: object) {
    return this.CallApi(".handle_quick_operation", {
      context,
      operation,
    });
  }

  public readonly Send: (...args: any) => void;
  public readonly Receive = (rawData: Buffer | ArrayBuffer | Buffer[]) => {
    if (typeof this.Send != "function") {
      throw new Error("The this.send method hadn't be configed! ");
    }

    try {
      var rawEvent = JSON.parse(rawData.toString()) as OnebotStandard.Events.Base;
    } catch {
      logger.error("Unknown received data. ");
      return;
    }

    this.emit(".native_data", rawEvent);

    logger.debug(`${rawEvent.post_type} event received. `);

    switch (rawEvent.post_type) {
      case "message": {
        const messageContext = new Object() as MessageContext;
        const message = rawEvent as OnebotStandard.Events.Message.Base;

        messageContext.symbol = Symbol(`message.${message.message_type}`);
        messageContext.content = message.raw_message;
        messageContext.rawData = message;

        messageContext.self = message.self_id;
        messageContext.target = message.user_id;

        messageContext.isFromGroup = () => message.message_type === "group";
        messageContext.isFromPrivate = () => message.message_type !== "group";

        messageContext.reply = (context: OnebotStandard.Message) => {
          if (this.supportQuickHandle) {
            this.QuickCallApi(message, {
              reply: context,
            });
            return;
          }
        };

        messageContext.forward = () => {
          logger.warning(`Forward method hasn't implement yet! `);
        };

        if (message.message_type == "group") {
          const groupContext = new Object(messageContext) as GroupMessageContext;
          const groupMessage = message as OnebotStandard.Events.Message.Group;

          groupContext.from = groupMessage.group_id;

          groupContext.kick = () => {
            if (this.supportQuickHandle) {
              this.QuickCallApi(message, {
                kick: true,
              });
              return;
            }
          };

          groupContext.mute = (time?: number) => {
            if (this.supportQuickHandle) {
              this.QuickCallApi(message, {
                ban: true,
                ban_duration: time,
              });
              return;
            }
          };

          groupContext.reply = (context: OnebotStandard.Message, at_sender: boolean = true) => {
            if (this.supportQuickHandle) {
              this.QuickCallApi(message, {
                reply: context,
                // at_sender,
              });
              return;
            }
          };

          groupContext.recall = () => {
            if (this.supportQuickHandle) {
              this.QuickCallApi(message, {
                delete: true,
              });
              return;
            }
          };

          if (this.DispatchEvent("message", groupContext)) {
            this.DispatchEvent("message.group", groupContext);
          }
        } else {
          const privateContext = new Object(messageContext) as PrivateMessageContext;
          
          if (this.DispatchEvent("message", privateContext)) {
            this.DispatchEvent("message.private", privateContext);
          }
        }
        break;
      }
      default: {
        logger.warning(`Unsupport event: ${rawEvent.post_type}. `);
        break;
      }
    }
  };

  private DispatchEvent<Z extends keyof Events>(eventName: Z, data: ReturnType<Events[Z]>) {
    if (eventName == "message") {
      const messageData = data as MessageContext;
      const result = middleware().ExecMiddlewares(messageData);

      if (typeof result != "boolean" || !result) {
        messageData.reply(result);
        return false;
      }

      this.emit("message", data);
      return true;
    }

    this.emit(eventName, data);
  }
}

export type Context = {
  symbol: symbol;
  rawData: OnebotStandard.Events.Base;

  isFromGroup(): boolean;
  isFromPrivate(): boolean;
};

export type MessageContext = Context & {
  symbol: symbol;
  self: number; // User | Member;
  target: number;
  message: OnebotStandard.Events.Message.Base["message"];
  content: OnebotStandard.Events.Message.Base["raw_message"];
  rawData: OnebotStandard.Events.Message.Base;

  reply(context: OnebotStandard.Message): void;
  forward(): void;
};

export type GroupMessageContext = MessageContext & {
  symbol: symbol;
  from: number;
  self: number;
  target: number;
  message: OnebotStandard.Events.Message.Group["message"];
  content: OnebotStandard.Events.Message.Group["raw_message"];
  rawData: OnebotStandard.Events.Message.Group;

  isFromGroup(): true;
  isFromPrivate(): false;

  mute(time?: number): void;
  kick(): void;
  reply(context: OnebotStandard.Message, at_sender?: boolean): void;
  recall(): void;
};

export type PrivateMessageContext = MessageContext & {
  symbol: symbol;
  self: number;
  target: number;
  message: OnebotStandard.Events.Message.Private["message"];
  content: OnebotStandard.Events.Message.Private["raw_message"];
  rawData: OnebotStandard.Events.Message.Private;

  isFromGroup(): false;
  isFromPrivate(): true;
};

export type NoticeContext = Context & {
  self: number;
  target: number;
  type: OnebotStandard.Events.Notice.Base["notice_type"];
  // content: OnebotStandard.Events.Notice.Base["raw_message"];
  rawData: OnebotStandard.Events.Notice.Base;
};

export type RequestContext = Context & {
  target: number;
  type: OnebotStandard.Events.Request.Base["request_type"];
  // content: OnebotStandard.Events.Notice.Base["raw_message"];
  rawData: OnebotStandard.Events.Request.Base;

  approve(): void;
};

export type MetaEventContext = Context & {
  type: OnebotStandard.Events.Meta.Base["meta_event_type"];
};

export interface Events {
  ".native_data"(data: Buffer): void;

  message(): MessageContext;
  notice(): NoticeContext;
  request(): RequestContext;
  meta_event(): MetaEventContext;

  "message.group"(): GroupMessageContext;
  "message.private"(): PrivateMessageContext;
}
