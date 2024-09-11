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

  private supportQuickHandle: boolean = true;

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
      globalLogger.debug(JSON.stringify({ action, params, echo: timestamp }));
    });
  }

  public async QuickCallApi(context: any, operation: any) {
    if (this.supportQuickHandle)
      try {
        return await this.CallApi(".handle_quick_operation", {
          context,
          operation,
        });
      } catch (data: any) {
        // const error = data as OnebotStandard.ApiResponse & { status: "failed" };

        this.supportQuickHandle = false;
        globalLogger.warning(
          `The current robot protocol side does not support quick handle operations, and the framework will be compatible with this. `,
        );
      }

    if ("reply" in operation) {
      const message = context as any;
      return await this.CallApi("send_msg", {
        message: operation.reply as OnebotStandard.Message,
        message_type: message.message_type,
        user_id: message.message_type == "group" ? undefined : message.user_id,
        group_id: message?.["group_id"],
      });
    }

    if ("kick" in operation && operation.kick == true) {
      const message = context as any;
      return await this.CallApi("set_group_kick", {
        user_id: message.user_id,
        group_id: message.group_id,
        reject_add_request: false,
      });
    }

    if ("delete" in operation && operation.delete == true) {
      const message = context as any;
      return await this.CallApi("delete_msg", { message_id: message.message_id });
    }

    if ("ban" in operation && operation.ban == true) {
      const message = context as any;
      return await this.CallApi("set_group_ban", {
        user_id: message.user_id,
        group_id: message.group_id,
        duration: operation?.["ban_duration"],
      });
    }

    if ("approve" in operation) {
      const request = context as any;
      if (request.request_type == "friend") {
        return await this.CallApi("set_friend_add_request", {
          flag: request.flag,
          approve: operation.approve,
          remark: operation.remark,
        });
      }

      return await this.CallApi("set_group_add_request", {
        flag: request.flag,
        sub_type: request.sub_type,
        approve: operation.approve,
        reason: operation.reason,
      });
    }
  }

  public readonly Send: (...any: any[]) => void;
  public readonly Receive = (rawData: Buffer | ArrayBuffer | Buffer[]) => {
    if (typeof this.Send != "function") {
      throw new Error("The this.send method hadn't be configed! ");
    }

    try {
      var rawEvent = JSON.parse(rawData.toString()) as OnebotStandard.Events.Base;
    } catch {
      globalLogger.error("Unknown received data. ");
      return;
    }

    this.emit(".native_data", rawEvent);

    globalLogger.debug(`${rawEvent.post_type} event received. `);

    switch (rawEvent.post_type) {
      case "message": {
        const message = rawEvent as OnebotStandard.Events.Message.Base;
        const messageContext = new Object() as MessageContext;

        messageContext.symbol = Symbol(`message.${message.message_type}`);
        messageContext.message = message.message;
        messageContext.content = message.raw_message;
        messageContext.rawData = message;

        messageContext.self = message.self_id;
        messageContext.target = message.user_id;

        messageContext.isFromGroup = () => message.message_type === "group";
        messageContext.isFromPrivate = () => message.message_type !== "group";

        messageContext.reply = (context: OnebotStandard.Message) => {
          this.QuickCallApi(message, {
            reply: context,
          });
          return;
        };

        messageContext.forward = () => {
          globalLogger.warning(`Forward method hasn't implement yet! `);
        };

        if (message.message_type == "group") {
          const groupMessage = message as OnebotStandard.Events.Message.Group;
          const groupContext = new Object(messageContext) as GroupMessageContext;

          groupContext.from = groupMessage.group_id;

          groupContext.kick = () => {
            this.QuickCallApi(message, {
              kick: true,
            });
            return;
          };

          groupContext.mute = (time?: number) => {
            this.QuickCallApi(message, {
              ban: true,
              ban_duration: time,
            });
            return;
          };

          groupContext.reply = (context: OnebotStandard.Message, at_sender: boolean = true) => {
            this.QuickCallApi(message, {
              reply: context,
              // at_sender,
            });
            return;
          };

          groupContext.recall = () => {
            this.QuickCallApi(message, {
              delete: true,
            });
            return;
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
      case "notice": {
        /**
         * 2024.08.23 Todo
         */
        break;
      }
      case "request": {
        const requestContext = new Object() as RequestContext;
        const request = rawEvent as OnebotStandard.Events.Request.Base;

        requestContext.symbol = Symbol(`message.${request.request_type}`);
        requestContext.type = request.request_type;
        requestContext.target = request.user_id;
        requestContext.comment = request.comment;
        requestContext.rawData = request;

        requestContext.isFromGroup = () => request.request_type == "group";
        requestContext.isFromPrivate = () => request.request_type != "group";

        if (request.request_type == "group") {
          const groupContext = new Object(requestContext) as GroupRequestContext;

          groupContext.approve = () => {
            this.QuickCallApi(request, {
              approve: true,
            });
          };

          groupContext.reject = (reason?: string) => {
            this.QuickCallApi(request, {
              approve: false,
              reason,
            });
          };

          this.DispatchEvent("request.group.member", groupContext);
        } else {
          const privateContext = new Object(requestContext) as PrivateRequestContext;

          privateContext.approve = (remark?: string) => {
            this.QuickCallApi(request, {
              approve: true,
              remark,
            });
          };

          privateContext.reject = () => {
            this.QuickCallApi(request, {
              approve: false,
            });
          };

          this.DispatchEvent("request.private.friend", privateContext);
        }

        this.DispatchEvent("request", requestContext);
        break;
      }
      case "meta_event": {
        const metaEventContext = new Object() as MetaEventContext;
        const metaEvent = rawEvent as OnebotStandard.Events.Meta.Base;

        metaEventContext.symbol = Symbol(`meta_event.${metaEvent.time}`);
        metaEventContext.type = metaEvent.meta_event_type;
        metaEventContext.rawData = metaEvent;

        metaEventContext.isFromGroup = () => false;
        metaEventContext.isFromPrivate = () => false;

        if (metaEvent.meta_event_type == "lifecycle") {
          const lifecycleMetaEvent = metaEvent as OnebotStandard.Events.Meta.Lifecycle;
          const lifecycleMetaEventContext = new Object(metaEventContext) as LifecycleMetaEventContext;

          lifecycleMetaEventContext.status = lifecycleMetaEvent.sub_type;

          this.DispatchEvent("meta_event.lifecycle", lifecycleMetaEventContext);
        } else {
          const heartbeatMetaEvent = metaEvent as OnebotStandard.Events.Meta.Heartbeat;
          const heartbeatMetaEventContext = new Object(metaEventContext) as HeartbeatMetaEventContext;

          heartbeatMetaEventContext.status = heartbeatMetaEvent.status;
          heartbeatMetaEventContext.interval = heartbeatMetaEvent.interval;

          this.DispatchEvent("meta_event.heartbeat", heartbeatMetaEventContext);
        }

        this.DispatchEvent("meta_event", metaEventContext);
        break;
      }
      default: {
        globalLogger.warning(`Unsupport event: ${rawEvent.post_type}. `);
        break;
      }
    }
  };

  private DispatchEvent<Z extends keyof Events>(eventName: Z, data: ReturnType<Events[Z]>) {
    if (eventName == "message") {
      const messageData = data as MessageContext;
      const result = middleware().Execute(messageData);

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

/**
 * 最难写的
 */

export type NoticeContext = Context & {
  target: number;
  type: OnebotStandard.Events.Notice.Base["notice_type"];
  // content: OnebotStandard.Events.Notice.Base["raw_message"];
  rawData: OnebotStandard.Events.Notice.Base;
};

export type GroupNoticeContext = NoticeContext & {
  from: number;
  initiator: number;
  type: OnebotStandard.Events.Notice.Base["notice_type"];
  status?: string;
  // content: OnebotStandard.Events.Notice.Base["raw_message"];
  rawData: OnebotStandard.Events.Notice.Base;
};

export type PrivateNoticeContext = NoticeContext & {
  target: number;
  type: OnebotStandard.Events.Notice.Base["notice_type"];
  content_id?: number;
  rawData: OnebotStandard.Events.Notice.Base;
};

export type RequestContext = Context & {
  target: number;
  type: OnebotStandard.Events.Request.Base["request_type"];
  comment: string;
  rawData: OnebotStandard.Events.Request.Base;

  approve(): void;
};

export type GroupRequestContext = RequestContext & {
  target: number;
  type: OnebotStandard.Events.Request.Group["request_type"];
  status: OnebotStandard.Events.Request.Group["sub_type"];
  rawData: OnebotStandard.Events.Request.Group;

  approve(): void;
  reject(reason?: string): void;
};

export type PrivateRequestContext = RequestContext & {
  target: number;
  type: OnebotStandard.Events.Request.Friend["request_type"];
  rawData: OnebotStandard.Events.Request.Friend;

  approve(remark?: string): void;
  reject(): void;
};

export type MetaEventContext = Context & {
  type: OnebotStandard.Events.Meta.Base["meta_event_type"];
};

export type LifecycleMetaEventContext = Context & {
  type: OnebotStandard.Events.Meta.Lifecycle["meta_event_type"];
  status: OnebotStandard.Events.Meta.Lifecycle["sub_type"];
};

export type HeartbeatMetaEventContext = Context & {
  type: OnebotStandard.Events.Meta.Heartbeat["meta_event_type"];
  status: OnebotStandard.Defines.Status;
  interval: number;
};

export interface Events {
  ".native_data"(data: Buffer): void;

  message(): MessageContext;
  notice(): NoticeContext;
  request(): RequestContext;
  meta_event(): MetaEventContext;

  "message.group"(): GroupMessageContext;
  "message.private"(): PrivateMessageContext;

  "request.group.member"(): GroupRequestContext;
  "request.private.friend"(): PrivateRequestContext;

  "meta_event.lifecycle"(): LifecycleMetaEventContext;
  "meta_event.heartbeat"(): HeartbeatMetaEventContext;
}
