declare namespace OnebotStandard {
  export namespace Defines {
    export type UserInfo = {
      user_id: number;
      nickname: string;
    };

    export type StrangerInfo = UserInfo & {
      sex: "male" | "female" | "unknown";
      age: number;
    };

    export type FriendInfo = UserInfo & {
      remark: string;
    };

    export type GroupInfo = {
      group_id: number;
      group_name: string;
      member_count: number;
      max_member_count: number;
    };

    export type GroupMemberInfo = {
      group_id: number;
      user_id: number;
      nickname: string;
      card: string;
      sex: TGender;
      age: number;
      area: string;
      join_time: number;
      last_sent_time: number;
      level: string;
      role: TGroupRole;
      unfriendly: boolean;
      title: string;
      title_expire_time: number;
      card_changeable: boolean;
    };

    export type HonorMemberInfo = UserInfo & {
      avatar: string;
    };

    export type GroupHonorInfo = {
      group_id: number;
      current_talkative?: HonorMemberInfo & { day_count: number };
      talkative_list?: Array<HonorMemberInfo & { description: string }>;
      performer_list?: Array<HonorMemberInfo & { description: string }>;
      legend_list?: Array<HonorMemberInfo & { description: string }>;
      strong_newbie_list?: Array<HonorMemberInfo & { description: string }>;
      emotion_list?: Array<HonorMemberInfo & { description: string }>;
    };

    export type Status = { online: boolean; good: boolean };
    export type LoginInfo = {
      user_id: number;
      nickname: string;
    };
    export type VersionInfo = {
      app_name: string;
      app_version: string;
      protocol_version: string;
    };
  }

  enum ForwardWebsocketFailedCode {
    // Retcode = HTTP status
    1400 = 400,
    1401 = 401,
    1403 = 403,
    1404 = 404,
  }

  type ApiResponse = /* success */ {
    status: "ok";
    retcode: 0;
    data: Events.Base | null;
  } & /* async */ {
    status: "async";
    retcode: 1;
    data: null;
  } & /* failure */ {
    status: "failed";
    retcode: keyof typeof ForwardWebsocketFailedCode;
    data: null;
  };

  export type Apis = {
    /**
     * @deprecated
     */
    ".handle_quick_operation"(params: { context: object; operation: object }): void;

    send_private_msg(params: { user_id: number; message: Message; auto_escape?: boolean }): number;
    send_group_msg(params: { group_id: number; message: Message; auto_escape?: boolean }): number;
    send_msg(params: {
      message: Message;
      message_type?: "private" | "group";
      user_id?: number;
      group_id?: number;
      auto_escape?: boolean;
    }): number;
    delete_msg(params: { message_id: number }): void;
    get_msg(params: { message_id: number }): MessageElements;
    get_forward_msg(params: { id: string }): Segment.Node[];
    send_like(params: { user_id: number; times?: number }): void;
    set_group_kick(params: { group_id: number; user_id: number; reject_add_request?: boolean }): void;
    set_group_ban(params: { group_id: number; user_id: number; duration?: number }): void;
    set_group_anonymous_ban(params: {
      group_id: number;
      anonymous?: object;
      anonymous_flag?: string;
      duration?: number;
    }): void;
    set_group_whole_ban(params: { group_id: number; enable?: boolean }): void;
    set_group_admin(params: { group_id: number; user_id: number; enable?: boolean }): void;
    set_group_anonymous(params: { group_id: number; enable?: boolean }): void;
    set_group_card(params: { group_id: number; user_id: number; card?: string }): void;
    set_group_name(params: { group_id: number; group_name: string }): void;
    set_group_leave(params: { group_id: number; is_dismiss?: boolean }): void;
    set_group_special_title(params: {
      group_id: number;
      user_id: number;
      special_title?: string;
      duration?: number;
    }): void;
    set_friend_add_request(params: { flag: string; approve?: boolean; remark?: string }): void;
    set_group_add_request(params: {
      flag: string;
      sub_type: "add" | "invite";
      approve?: boolean;
      reason?: string;
    }): void;
    get_login_info(): Defines.LoginInfo;
    get_stranger_info(params: { user_id: number; no_cache?: boolean }): Defines.StrangerInfo;
    get_friend_list(): Array<Defines.FriendInfo>;
    get_group_info(params: { group_id: number; no_cache?: boolean }): Defines.GroupInfo;
    get_group_list(): Array<Defines.GroupInfo>;
    get_group_member_info(params: { group_id: number; user_id: number; no_cache?: boolean }): Defines.GroupMemberInfo;
    get_group_member_list(params: { group_id: number }): Array<Defines.GroupMemberInfo>;
    get_group_honor_info(params: {
      group_id: number;
      type: "talkative" | "performer" | "legend" | "strong_newbie" | "emotion" | "all";
    }): Defines.GroupHonorInfo;
    get_cookies(params: { domain?: string }): { cookies: string };
    get_csrf_token(): { token: number };
    get_credentials(params: { domain?: string }): {
      cookies: string;
      token: number;
    };
    get_record(params: { file: string; out_format: string }): { file: string };
    get_image(params: { file: string }): { file: string };
    can_send_image(): { yes: boolean };
    can_send_record(): { yes: boolean };
    get_status(): Defines.Status;
    get_version_info(): Defines.UserInfo;
    set_restart(params: { delay?: number }): void;
    clean_cache(): void;
  };

  export namespace Events {
    export type Base = {
      time: number;
      self_id: number;
      post_type: "message" | "notice" | "request" | "meta_event";
    };

    export namespace Message {
      export type Base = Events.Base & {
        post_type: "message";
        message_type: "private" | "group";
        sub_type: string;
        user_id: number;
        message_id: number;
        message: Message;
        raw_message: string;
        font: number;
        sender: Defines.StrangerInfo;
      };

      export type Private = Base & {
        message_type: "private";
        sub_type: "friend" | "group" | "other";
      };

      export type Group = Base & {
        message_type: "group";
        sub_type: "normal" | "anonymous" | "notice";
        group_id: number;
        anonymous: { id: number; name: string; flag: string };
        sender: Omit<
          Defines.GroupMemberInfo,
          | "group_id"
          | "join_time"
          | "last_sent_time"
          | "title_expire_time"
          | "unfriendly"
          | "title_expire_time"
          | "card_changeable"
        >;
      };
    }

    export namespace Notice {
      export type Base = Events.Base & {
        post_type: "notice";
        notice_type: string;
        user_id: number;
      };

      export namespace Group {
        export type AdminChange = Base & {
          notice_type: "group_admin";
          sub_type: "set" | "unset";
          group_id: number;
        };

        /**
         * @alias Mute
         */
        export type Ban = Base & {
          notice_type: "group_ban";
          sub_type: "ban" | "lift_ban";
          group_id: number;
          duration: number;
          operator_id: number;
        };

        export type FileUpload = Base & {
          notice_type: "group_upload";
          group_id: number;
          file: {
            id: string;
            name: string;
            size: number;
            busid: number;
          };
        };

        export type HonorChange = Base & {
          notice_type: "notify";
          sub_type: "honor";
          group_id: number;
          honor_type: "talkative" | "performer" | "emotion";
        };

        /**
         * @alias Ban
         */
        export type Mute = Ban;

        export type MemberDecrease = Base & {
          notice_type: "group_decrease";
          sub_type: "leave" | "kick" | "kick_me";
          group_id: number;
          operator_id: number;
        };

        export type MemberIncrease = Base & {
          notice_type: "group_increase";
          sub_type: "approve" | "invite";
          group_id: number;
          operator_id: number;
        };

        export type Poke = Base & {
          notice_type: "notify";
          sub_type: "poke";
          group_id: number;
          target_id: number;
        };

        export type Recall = Base & {
          notice_type: "group_recall";
          group_id: number;
          message_id: number;
          operator_id: number;
        };

        export type LuckyKing = Base & {
          notice_type: "notify";
          sub_type: "lucky_king";
          group_id: number;
          target_id: number;
        };
      }

      export namespace Friend {
        export type Add = Base & {
          notice_type: "friend_add";
        };

        export type Recall = Base & {
          notice_type: "friend_recall";
          message_id: number;
          operator_id: number;
        };
      }
    }

    export namespace Request {
      export type Base = Events.Base & {
        post_type: "request";
        request_type: "friend" | "group";
        user_id: number;
        comment: string;
        flag: string;
      }

      export type Friend = Base & {
        request_type: "friend";
      }

      export type Group = Base & {
        request_type: "group";
        sub_type: "add" | "invite";
        group_id: number
      }
    }

    export namespace Meta {
      export type Base = Events.Base & {
        post_type: "meta_event";
        meta_event_type: "lifecycle" | "heartbeat";
      }

      export type Lifecycle	= Base & {
        meta_event_type: "lifecycle"
        sub_type: "enable" | "disable" | "connect"
      }

      export type Heartbeat = Base & {
        meta_event_type: "heartbeat";
        status: Defines.Status;
        interval: number;
      }
    }
  }

  export namespace Segment {
    export type Common = {
      type: string;
      data: object | undefined;
    };

    export type At = Common & {
      type: "at";
      data: {
        qq: number | "all";
      };
    };

    export type Anonymous = Common & {
      type: "anonymous";
      data: {
        ignore?: 1 | 0;
      };
    };

    export type Contact = Common & {
      type: "contact";
      data: {
        type: "qq" | "group";
        id: string;
      };
    };

    export type CustomNode = Common & {
      type: "node";
      data: {
        user_id: string;
        nickname: string;
        content: string | TElements;
      };
    };

    export type CustomMusic = Common & {
      type: "music";
      data: {
        type: "custom";
        url: string;
        audio: string;
        title: string;
        image?: string;
        content?: string;
      };
    };

    export type Dice = Common & {
      type: "dice";
      data: {};
    };

    export type Face = Common & {
      type: "face";
      data: {
        id: number;
      };
    };

    export type File = Common & {
      type: "file";
      data: {
        file: string;
        name: string;
      };
    };

    export type Forward = Common & {
      type: "forward";
      data: {
        id: string;
      };
    };

    export type Image = Common & {
      type: "image";
      data: {
        summary?: string;
        file: string;
        type?: "flash";
        url?: string;
        cache?: 1 | 0;
        proxy?: 1 | 0;
        timeout?: number;
      };
    };

    export type JSON = Common & {
      type: "json";
      data: {
        data: string;
      };
    };

    export type Location = Common & {
      type: "location";
      data: {
        lat: string;
        lon: string;
        title?: string;
        content?: string;
      };
    };

    export type Music = Common & {
      type: "music";
      data: {
        type: "qq" | "163" | "xm";
        id: string;
      };
    };

    export type Node = Common & {
      type: "node";
      data: {
        id: string;
      };
    };

    export type Poke = Common & {
      type: "poke";
      data: {
        type: number;
        id: number;
        /**
         * @readonly
         */
        name?: string;
      };
    };

    export type RPS = Common & {
      type: "rps";
      data: {};
    };

    export type Reply = Common & {
      type: "reply";
      data: {
        id: string;
      };
    };

    export type Record = Omit<Image, "type"> & {
      type: "record";
    };

    export type Shake = Common & {
      type: "shake";
      data: {};
    };

    export type Share = Common & {
      type: "share";
      data: {
        url: string;
        title: string;
        content?: string;
        image?: string;
      };
    };

    /**
     * @deprecated
     */
    export type Text = Common & {
      type: "text";
      data: {
        text: string;
      };
    };

    export type Video = Omit<Image, "type"> & {
      type: "video";
    };

    export type XML = Common & {
      type: "xml";
      data: {
        data: string;
      };
    };

    export type Segments =
      | At
      | Anonymous
      | Contact
      | CustomNode
      | CustomMusic
      | Dice
      | Face
      | Forward
      | Image
      | JSON
      | Location
      | Music
      | Node
      | Poke
      | RPS
      | Reply
      | Record
      | Shake
      | Share
      | Shake
      | Text
      | Video
      | XML;

    export const segment = {
      /** @deprecated 文本，建议直接使用字符串 */
      Text(text: string): Text {
        return {
          type: "text",
          data: {
            text,
          },
        };
      },

      Face(id: number): Face {
        return {
          type: "face",
          data: {
            id,
          },
        };
      },

      /** 猜拳(id=1~3) */
      Rps(): RPS {
        return {
          type: "rps",
          data: {},
        };
      },

      /** 骰子(id=1~6) */
      Dice(): Dice {
        return {
          type: "dice",
          data: {},
        };
      },

      /** mention@提及
       * @param qq 全体成员为 all
       */
      At(qq: number | "all", text?: string, dummy?: boolean): At {
        return {
          type: "at",
          data: {
            qq,
            text,
            dummy,
          },
        };
      },

      /** 图片(支持http://,base64://) */
      Image(file: string, cache?: boolean, proxy?: boolean, timeout?: number): Image {
        return {
          type: "image",
          data: {
            file,
            cache: cache != undefined ? (cache ? 1 : 0) : undefined,
            proxy: proxy != undefined ? (proxy ? 1 : 0) : undefined,
            timeout,
          },
        };
      },

      /** 闪照(支持http://,base64://) */
      Flash(file: string, cache?: boolean, proxy?: boolean, timeout?: number): Image {
        return {
          type: "image",
          data: {
            type: "flash",
            file,
            cache: cache != undefined ? (cache ? 1 : 0) : undefined,
            proxy: proxy != undefined ? (proxy ? 1 : 0) : undefined,
            timeout,
          },
        };
      },

      /** 语音(支持http://,base64://) */
      Record(file: string | Buffer): Record {
        return {
          type: "record",
          data: {
            file: file.toString(),
          },
        };
      },

      /** 视频(仅支持本地文件) */
      Video(file: string): Video {
        return {
          type: "video",
          data: {
            file,
          },
        };
      },

      Json(data: any): JSON {
        return {
          type: "json",
          data: { data: JSON.stringify(data) },
        };
      },

      Xml(data: string, id?: number): XML {
        return {
          type: "xml",
          data: {
            data,
            id,
          },
        };
      },

      /** 链接分享 */
      Share(url: string, title: string, image?: string, content?: string): Share {
        return {
          type: "share",
          data: {
            url,
            title,
            image,
            content,
          },
        };
      },

      /** 位置分享 */
      Location(lat: number, lng: number, address: string, id?: string): Location {
        return {
          type: "location",
          data: {
            lat: String(lat),
            lon: String(lng),
            address,
            id,
          },
        };
      },

      /** id 0~6 */
      Poke(id: number, type: number): Poke {
        return {
          type: "poke",
          data: {
            id,
            type,
          },
        };
      },

      /** @deprecated 将CQ码转换为消息链 */
      FromCqcode(strData: string) {
        const resultElements: Segments[] = [];
        const matchedTokens = strData.matchAll(/\[CQ:[^\]]+\]/g);
        let prevIdx = 0;

        for (let token of matchedTokens) {
          const text = strData.slice(prevIdx, token.index).replace(/&#91;|&#93;|&amp;/g, DecodeOuterCQ);

          if (text) {
            resultElements.push({ type: "text", data: { text } });
          }

          const element = token[0];
          let cq = element.replace("[CQ:", "type=");
          cq = cq.substr(0, cq.length - 1);

          resultElements.push(ConvertCQ(cq));
          prevIdx = (token.index as number) + element.length;
        }

        if (prevIdx < strData.length) {
          const text = strData.slice(prevIdx).replace(/&#91;|&#93;|&amp;/g, DecodeOuterCQ);
          if (text) {
            resultElements.push({ type: "text", data: { text } });
          }
        }
        return resultElements;
      },
    };

    /**
     * @deprecated
     */
    export function DecodeOuterCQ(context: string) {
      if (context === "&#91;") return "[";
      if (context === "&#93;") return "]";
      if (context === "&amp;") return "&";
      return "";
    }

    /**
     * @deprecated
     */
    export function DecodeInnerCQ(context: string) {
      if (context === "&#44;") return ",";
      return DecodeOuterCQ(context);
    }

    /**
     * @deprecated
     */
    export function ConvertCQ(context: string, sep = ",", equal = "=") {
      const result: any = {};
      const blocks = context.split(sep);

      for (let part of blocks) {
        const i = part.indexOf(equal);
        if (i === -1) {
          continue;
        }
        result[part.substring(0, i)] = part.substr(i + 1).replace(/&#44;|&#91;|&#93;|&amp;/g, DecodeCQInside);
      }

      for (let k in result) {
        try {
          if (k !== "text") {
            result[k] = JSON.parse(result[k]);
          }
        } catch {}
      }

      return result as Segment.Segments;
    }
  }

  export type Message = string | Segment.Segments | Array<string | Segment.Segments>;
}

export {}