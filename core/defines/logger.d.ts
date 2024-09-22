declare global {
  var logger: import("winston").Logger;

  declare namespace Winston {
    declare interface Logger {
      public child(options: { modules: string | Array<string> });
    }
  }
}

export {};
