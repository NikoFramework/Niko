import { createLogger, format, transports } from "winston";
const { combine, colorize, printf, uncolorize, timestamp } = format;

global.logger = createLogger({
  defaultMeta: { projectName: "NikoNext" },
  level: "info",
  format: combine(
    colorize(),
    timestamp(),
    printf(({ level, message, modules, projectName, timestamp }) => {
      var label = projectName as string;
      const type = typeof modules;

      if (type == "string") {
        var label = [projectName, modules].join(".");
      } else if (Array.isArray(modules)) {
        var label = [projectName, ...modules].map((val) => val || "<???>").join(".");
      }

      return `${timestamp} [${label}] ${level}: ${message}`;
    })
  ),
  transports: [
    new transports.File({
      filename: `./logs/${new Date().valueOf()}.log`,
      format: uncolorize(),
      handleExceptions: true,
      handleRejections: true,
    }),
    new transports.Console({ handleExceptions: true, handleRejections: true }),
  ],
});

Object.freeze(global.logger);