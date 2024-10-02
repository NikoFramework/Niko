import { createLogger, format, transports } from "winston";

global["Niko"] = global["Niko"] || Object.create({});

/* Logger初始化 */
const { combine, colorize, printf, uncolorize, timestamp } = format;

global.Niko["logger"] = <any>createLogger({
  defaultMeta: { projectName: "NikoNext" },
  level: "info",
  format: combine(
    colorize(),
    timestamp(),
    printf(({ level, message, modules, projectName, timestamp }) => {
      var label = projectName as string;

      const type = typeof modules;
      if (type == "string") {
        label = [projectName, modules].join(".");
      }

      if (Array.isArray(modules)) {
        label = [projectName, ...modules].map((val) => val || "<???>").join(".");
      }

      return `${timestamp} [${label}] ${level}: ${message}`;
    })
  ),
  transports: [
    new transports.Console({ handleExceptions: true, handleRejections: true }),
    new transports.File({
      filename: `./logs/${new Date().valueOf()}.log`,
      format: uncolorize(),
      handleExceptions: true,
      handleRejections: true,
    }),
  ],
});
