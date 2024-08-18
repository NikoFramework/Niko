import { Client, MessageEvent, Segment } from "onebot-client-next";

import fs from "fs";
import path from "path";

import PrettyFeedback from "Niko/pretty_feedback";
import { Plugin, PluginInstance } from "Niko/plugin_manager";

export default class extends Plugin implements PluginInstance {
  public PLUGIN_NAME: string = "StatusInformation";
  public PLUGIN_VERSION: string = "v1.0.0-dev";

  public constructor() {
    super();

    this.RegisterCommand({
      name: "markdown",
      callback: this.fn,
    });
  }

  private async fn(this: Client, args: any, event: MessageEvent.TGroupMessageEvent) {
    const senderId = event.sender.user_id;
    if (senderId != 2076274471 && senderId != 2937396379) {
      return;
    }

    const instance = (await PrettyFeedback()).As(`markdown.${event.group_id}`);

    instance
      .GenerateClassicFeedback("Markdown", event.raw_message.slice("* markdown ".length), true)
      .then((val) => {
        event.reply(val);
      })
      .catch((reason) => {
        event.reply(reason);
      });
  }
}
