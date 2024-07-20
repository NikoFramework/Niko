import LoggerProvider from "./logger";
import { Client } from "./onebot-client-next";

const logger = LoggerProvider.getLogger("kamenomi_bot.main");
const client = new Client(1225763245, {
  websocket_address: "ws://127.0.0.1:19133",
});

client.on("message.group.normal", (msg) => {
  if (msg.raw_message == "你好，Kam") {
    console.log(msg.reply);
    msg.reply("Hiiiiiiiiiiiiiiiiiiiiiiiiiii");
  }
});

client.Start();
