/**
 * 
 *           终端日志
 * 
 */

import fs from "node:fs";
import path from "node:path";
import util from "node:util";

export default async function InitializeTerminal() {
  const action = logger.action("Initializing terminal.");

  try {
    const logPath = path.resolve(process.cwd(), "log");
    fs.mkdirSync(logPath, { recursive: true });

    const logFile = path.resolve(logPath, `${new Date().toISOString().replaceAll(/[-:TZ]/g, "")}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: "a" });

    const oLog = console.log.bind(console);

    console.log = (...data: any[]) => {
      logStream.write(util.format(...data) + "\n");
      oLog(...data);
    }

    const oError = console.log.bind(console);

    console.error = (...data: any[]) => {
      logStream.write(util.format(...data) + "\n");
      oError(...data);
    }

    action.succeeded();
  } catch (error) {
    action.failed(error as Error);
  }
}
