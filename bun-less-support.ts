import type { BunPlugin } from "bun";

import less from 'less';

const plugin: BunPlugin = {
  name: 'less',
  setup(build) {
    build.onLoad({ filter: /\.less$/ }, async (args) => {
      const source = await Bun.file(args.path).text();
      const { css } = await less.render(source);
      return {
        contents: css,
        loader: "text",
      };
    });
  },
};

export default plugin;