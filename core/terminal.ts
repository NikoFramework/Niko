/**
 *
 *           终端日志
 *
 */

import fs from "node:fs";
import path from "node:path";
import util from "node:util";

export default function InitializeTerminal() {
  const action = niko.logger.action("Initializing terminal.");

  try {
    const logPath = path.resolve(process.cwd(), "log");
    fs.mkdirSync(logPath, { recursive: true });

    const logFile = path.resolve(logPath, new Date().toISOString().replaceAll(/[-:TZ]/g, "") + ".log");
    const logStream = fs.createWriteStream(logFile, { flags: "a" });

    const originLog = console.log.bind(console);

    console.log = (...data: any[]) => {
      logStream.write(util.format(...(data.map(SerializeAnsiEscapeCode))) + "\n");
      originLog(...data);
    };

    const originError = console.error.bind(console);

    console.error = (...data: any[]) => {
      logStream.write(util.format(...(data.map(SerializeAnsiEscapeCode))) + "\n");
      originError(...data);
    };

    action.succeeded();
  } catch (error) {
    action.failed(error as Error);
  }
}

export function SerializeAnsiEscapeCode(content: string) {
  return content.replaceAll(
    /[\u001B\u009B][[\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\d\/#&.:=?%@~_]+)*|[a-zA-Z\d]+(?:;[-a-zA-Z\d\/#&.:=?%@~_]*)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-ntqry=><~]))/g,
    "",
  );
}
