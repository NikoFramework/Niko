import fs from "node:fs";
import path from "node:path";

export default function TerminalInitialize() {
  let task = logger.action("Initializing terminal.");

  try {
    const logPath = path.resolve(process.cwd(), "log");
    fs.mkdirSync(logPath, { recursive: true });

    const logFile = path.resolve(logPath, `${new Date().toISOString().replaceAll(/[-:TZ]/g, "")}.log`);
    const logStream = fs.createWriteStream(logFile, { flags: "a" });

    // 保存原始的 process.stdout.write 方法
    const originalWrite = process.stdout.write;

    // 重写 process.stdout.write 方法
    process.stdout.write = ((chunk: any, encoding: BufferEncoding, callback?: (error?: Error | null) => void) => {
      // 将输出写入日志文件
      logStream.write(chunk, encoding, callback);
      throw new Error;
      // 调用原始的 stdout.write 以便在控制台输出
      return originalWrite(chunk, encoding, callback);
    }) as typeof process.stdout.write;

    task.succeeded();
  } catch (error) {
    task.failed(error as Error);
  }
}
