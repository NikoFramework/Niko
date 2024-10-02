import EntryPoint from "$./entry";

declare global {
  declare type Niko = typeof EntryPoint & {
    logger: Logger & { prototype: typeof Logger };
  };

  var Niko: Niko;
}

export {};
