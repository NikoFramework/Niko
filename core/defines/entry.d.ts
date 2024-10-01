import EntryPoint from "$./entry";

declare global {
  declare type Niko = typeof EntryPoint & {};

  var Niko: Niko;
}

export {};
