import { LogLevel } from "typescript-logging";
import { Log4TSProvider } from "typescript-logging-log4ts-style";

const LoggerProvider = Log4TSProvider.createProvider("kamenomi.bot.logger", {
  level: LogLevel.Debug,
  groups: [
    {
      expression: new RegExp(".+"),
    },
  ],
});

export default LoggerProvider;
