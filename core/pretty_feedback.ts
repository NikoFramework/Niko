import path from "path";
import puppeteer, { Browser } from "puppeteer";

var browser = {} as Browser;

function HtmlToImage(context: string, isBase64: true): Promise<string>;
function HtmlToImage(context: string, isBase64: false | undefined): Promise<Buffer>;
async function HtmlToImage(context: string, isBase64?: boolean): Promise<Buffer | string> {
  try {
    const page = await browser.newPage();
    await page.setContent(context);
    await page.setViewport({ width: 1920, height: 1080 });
    const screenshot = (await page.screenshot({ encoding: isBase64 ? "base64" : "binary" })) as any; /* Bad */
    await page.close();
    return isBase64 ? screenshot : Buffer.from(screenshot);
  } catch (error) {
    return Promise.reject(error);
  }
}

export default async function InitializePrettyFeedback() {
  let task = logger.action("Launching puppeteer. ");

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "-disable-gpu",
        "-disable-dev-shm-usage",
        "-disable-setuid-sandbox",
        "-no-first-run",
        "-no-sandbox",
        "-no-zygote",
        "-single-process",
      ],
    });
    task.succeeded();
  } catch (error) {
    task.failed(error as Error);
  }
}

export const DEFAULT_HTML_TEMPLATE = (title: string, inject: string) => /* html */ `
  <div id="frame">
    <style>
      * {
        margin: 0;
      }

      div#frame {
        position: absolute;
        top: 0;
        left: 0;
        width: 1920px;
        height: 1080px;

        background: linear-gradient(to bottom right, rgb(238, 198, 205), rgb(144, 193, 226));
      }
    </style>

    <div id="main">
      <style>
        div#main {
          position: absolute;
          top: 16px;
          left: 16px;
          right: 16px;
          bottom: 16px;

          border-radius: 12px;
          backdrop-filter: blur(10px);
          background-color: #ffffffa8;
        }

        div#title {
          display: block;
          padding: 8px;
          margin-top: 10px;
          margin-bottom: 10px;

          position: relative;
          top: 0;
          left: 0;
          width: auto;

          font-size: larger;
          text-align: center;

          &::after {
            content: "{{current_time}}";

            font-size: small;
            vertical-align: text-bottom;
          }
        }

        div#content {
          position: relative;
          top: 0;
          left: 0;
          width: 100%;
          bottom: 0;
        }
      </style>

      <div id="title">${title}</div>
      <div id="content">${inject}</div>
    </div>
  </div>
`;

var queueList = new Set<string>();

export function Generate(name: string, htmlContext: string) {
  return new Promise<Buffer>((ret, skip) => {
    if (queueList.has(name)) {
      skip(`${name} has already been pushed on queue list.`);
      return;
    }

    queueList.add(name);

    const beginTime = new Date().valueOf();
    logger.debug(`Begin rendering. ${name}`);
    HtmlToImage(htmlContext.replace("{{current_time}}", new Date().toLocaleString()), false)
      .then((buffer) => {
        logger.debug("Rendered! Spent " + (new Date().valueOf() - beginTime) + "ms. ");
        ret(buffer as Buffer);
      })
      .catch((reason) => {
        skip(`Has errored in ${name}, because ${reason}`);
      })
      .finally(() => {
        queueList.delete(name);
      });
  });
}
