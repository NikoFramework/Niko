/// <reference path="./defines/global.d.ts"/>

import packageJson from "../package.json";

import { Config } from "./utils";

process.stdout.write(`
███╗   ██ ██ ██╗  ██╗██████╗
████╗  ██ ██ ██║ ██╔██╔═══██╗
██╔██╗ ██ ██ █████╔╝██║   ██║   ${packageJson.version}.Next
██║╚██╗██ ██ ██╔═██╗██║   ██║   By ${packageJson.author.name}
██║ ╚████ ██ ██║  ██╚██████╔  
╚═╝  ╚═══ ╚═ ╚═╝  ╚═╝╚═════╝   

`);

const a = Config.LoadConfig("./config/.toml");
