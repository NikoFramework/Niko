/**
 * 
 *           反馈美化
 * 
 */

import * as markdown from "commonmark";
import puppeteer, { Browser } from "puppeteer";

import util from "node:util";
import { Segment } from "onebot-client-next";

var markdownRender = new markdown.Parser();
var markdownWriter = new markdown.HtmlRenderer();

export default async function InitializePrettyFeedback() {
  if (!PrettyFeedback.browser) {
    const task = logger.action("Launching puppeteer. ");

    try {
      PrettyFeedback.browser = await puppeteer.launch({
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

  return PrettyFeedback.Initialize();
}

export class PrettyFeedback {
  // Initialize single instance
  public static Initialize() {
    if (!PrettyFeedback.instance) {
      PrettyFeedback.instance = new PrettyFeedback();
    }

    return PrettyFeedback.instance;
  }

  /* - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - */

  public readonly initiator = "Framework";

  public static browser: Browser;
  public static queueList = new Set<string>();

  private static instance: PrettyFeedback;
  private constructor() {}

  public As(initiator: string) {
    const singleInstance = new PrettyFeedback();

    Object.defineProperty(singleInstance, "initiator", {
      value: initiator,
      writable: false,
      enumerable: true,
      configurable: true,
    });

    return singleInstance;
  }

  public async GenerateClassicFeedback(title: string, data: string, markdown: boolean = false) {
    var context = data;

    if (markdown) {
      context = markdownWriter.render(markdownRender.parse(context));
    }

    const base64_url = (await this.RenderHtmlToImage(this.GenerateTemplateHtml(title, context))).toString("base64");
    return Segment.segment.Image("base64://" + base64_url);
  }

  public async RenderHtmlToImage(context: string) {
    if (PrettyFeedback.queueList.has(this.initiator)) {
      return Promise.reject(`${this.initiator} has already been pushed on queue list.`);
    }

    PrettyFeedback.queueList.add(this.initiator);

    const beginTime = new Date().valueOf();
    logger.debug(`Begin rendering. ${this.initiator}`);

    try {
      const result = await this.NativeGenerateHtmlToImage(context);
      logger.debug("Rendered! Spent " + (new Date().valueOf() - beginTime) + "ms. ");

      return result;
    } catch (error) {
      return Promise.reject(`Has errored in ${this.initiator}, because ${error}`);
    } finally {
      PrettyFeedback.queueList.delete(this.initiator);
    }
  }

  public GenerateTemplateHtml(title: string, context: string) {
    return util.format(
      /* html */ `
    <!DOCTYPE html>
    <html lang="zh">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>PrettyFeedback</title>
      </head>
      <body>
        <style>
          * {
            margin: 0;
          }
    
          body {
            position: relative;
            padding-top: 56.25%;
            height: 0;
    
            background-color: #3b3b3b;
    
            #frame {
              position: absolute;
              top: 0;
              width: 100%;
              height: 100%;
    
              border-radius: 8px;
              background: linear-gradient(to bottom right, rgb(253, 194, 204), rgb(140, 203, 245));
              background-size: cover;
    
              #content {
                position: absolute;
                top: 8%;
                left: 2.5%;
                right: 2.5%;
                bottom: 8%;
    
                border-radius: 8px;
                background-color: #ffffff85;
    
                h1 {
                  padding-left: 2vw;
    
                  line-height: 6vw;
                  font-size: 2.1vw;
                  font-weight: 500;
    
                  &::after {
                    content: "";
    
                    margin-left: 1.8vw;
                    margin-right: 1.8vw;
    
                    position: absolute;
                    top: 6vw;
                    left: 0;
                    right: 0;
                    height: 1.4px;
    
                    filter: blur(1px);
                    border-radius: 1.2px;
                    background-color: rgba(160, 165, 165, 0.486);
                  }
                }
    
                #context {
                  position: absolute;
                  top: 7.25vw;
                  left: 1vw;
                  right: 1vw;
                  bottom: 1vw;
    
                  border-radius: 8px;
                  background-color: #fff;
                }
              }
    
              &::after {
                color: rgba(145, 145, 145, 0.027);
                content: "%s";
    
                position: absolute;
                right: 0;
                bottom: 0;
              }
            }
          }
        </style>
        <div id="frame">
          <div id="content">
            <h1>%s</h1>
            <div id="context">%s</div>
          </div>
        </div>
      </body>
    </html>
    
    `,
      new Date().toLocaleString(),
      title,
      context,
    );
  }

  public async NativeGenerateHtmlToImage(context: string) {
    try {
      const page = await PrettyFeedback.browser.newPage();
      await page.setContent(context);
      await page.setViewport({ width: 1920, height: 1080 });
      const screenshot = await page.screenshot({ encoding: "binary" });
      await page.close();
      return Buffer.from(screenshot);
    } catch (error) {
      return Promise.reject(error);
    }
  }
}
