![Niko](https://socialify.git.ci/NikoFramework/Niko/image?font=Source%20Code%20Pro&forks=1&issues=1&language=1&logo=https%3A%2F%2Fi.redd.it%2F9uumoptckdf71.png&name=1&owner=1&pattern=Plus&pulls=1&stargazers=1&theme=Auto)
---
*Niko 名称取自 Oneshot 游戏中 Niko 主角，头像取自 [Reddit](https://www.reddit.com/r/oneshot/comments/oxxj5s/niko_when_pancakes/)* 。
## 项目介绍
[Niko组织](https://github.com/NikoFramework/) 基于 `BunJS` 开发的 **通透**、**简易** 的机器人框架项目。
本框架遵循 [OnebotV11](https://github.com/botuniverse/onebot-11) 标准协议，理论上兼容所有的 Bot协议端 等。

## 开发初衷
现如今，已经有很多成熟的机器人框架（如 [Koishi](https://github.com/koishijs/koishi) 等）正发挥着光彩，也都对我有很大的启发，于是我开发一个新的框架来历练我的逻辑思维。虽然本框架并没有什么优势可以值得提出来，但是跟组织成员、朋友以及开源社区的成员们一起协同开发，对于我来讲是意义非凡的。

## 使用方式
> 本项目主要依靠于 `BunJS` 运行、编译，优势在于不怕 `CommonJS` 与 `ECMAScriptModule` 之间的特性冲突，可以直接运行 `.ts` 文件，也可以靠 `BunJS 插件` 实现导入不同的文件。

### 安装依赖项

BunJS
```shell
bun install
```

NPM
```shell
npm install
```

### 框架配置
框架配置处在 `./config/bot.config.toml`，且基于简单、易读的TOML配置格式，使得使用更加上手。
配置参考
```toml
websocket_address = "ws://127.0.0.1:19132" # ws连接目标协议端
websocket_auth_token = "a_simple_token" # ws连接所需的 token
triggle_token = "" # 触发指令的符号前缀
```

## 计划
~~- [ ] 实现 HTTP(_POST) 太麻烦~~
- [ ] 实现 ws 反向连接
- [ ] 实现插件工作空间
- [ ] 实现中间件
- [ ] 实现适配器

## 关于

### 至所有人

> [!CAUTION]
> 本机器人框架项目仅作学习使用，使用者无论发生任何事情都与本框架项目的开发者及其组织没有任何责任。

### 至开发者

本项目不利于在简中互联网（如 Bilibili、QQ 等）传播，若发现其相关行为，本项目将永久存档或设为私有项目。

请不要糟蹋中国内仅剩的开源环境！

### 至使用者/追究人员

而且，本项目独立于所有依赖本项目的 **派生衍生** 的子项目或新框架，若使用者在及其 **派生衍生** 中用于违法行为（基于中国法律法规），请相关追责工作人员或追究人员谨慎判断本项目的实际性质。

## 协议
本框架基于 MPL-2.0 协议开源。