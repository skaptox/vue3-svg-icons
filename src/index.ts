import { Plugin } from "rollup";
import { createFilter } from "@rollup/pluginutils";
import { parseFragment } from "parse5";
import { inspect } from "util";

import { Options } from "./types";
import { parseQuery } from "./utils";

export default (options: Options = {}): Plugin => {
  const isIncluded = createFilter(options.include, options.exclude);

  const plugin: Plugin = {
    name: "vue3-svg-icons",
    transform(code, id) {
      const query = parseQuery(id);

      if (!query.vue) return null;
      if (!isIncluded(id)) return null;
      if (query.type !== "template") return null;

      const ast = parseFragment(code);
      console.log(inspect(ast, { depth: null, maxArrayLength: null }));

      return null;
    },
  };

  return plugin;
};
