# 适配器流程 （!Not Final!）

## 术语声明

### _struct `event`
    参考：{
        time: number;
        self_id: number;
        post_type: string;
    }

### _struct `context`
    参考：{
        raw: event;
        kick: (forever boolean = false) => void;
        mute: (time: number | undefined = 600 /* ms */) => void
        recall: () => void;
    }

### _struct `elements`
    参考：string | element | (string|element)[]

### _function Middleware

## 运作流程

1. 收到接口提供方的 event 事件
    > 去除掉非 json && `!data["post_type"]` 事件

2. 生成新的结构体 `context`
    > 从 `event` 传递必要的数据至 `context`

3. 调用中间件 `Middleware`
    1. 若 `context` 中属于 `message 消息`
        > 且若有其中间件返回 `elements` 结构体，即回复此些返回值。
        
        若 `context` 中属于 `group message 消息`
        > 若返回来自 `context` 中的 `recall` 对象（非 call 后返回值），即尝试对目标消息撤回。
        > 若返回 [ 来自 `context` 中的 `mute` 对象，时长（可空） ] 数组对象，即尝试对目标用户对象禁言。
        > 若返回 [ 来自 `context` 中的 `kick` 对象，是否永久（可空） ] 数组对象，即尝试对目标用户对象踢出群聊。
