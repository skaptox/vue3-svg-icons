import fs from "fs-extra";

import { createFilter } from "@rollup/pluginutils";
import { Plugin } from "rollup";
import cheerio from "cheerio";

import { Options } from "./types";
import { humanlizePath, parseQuery } from "./utils";

export default (options: Options = {}): Plugin => {
  const isIncluded = createFilter(options.include, options.exclude);

  const plugin: Plugin = {
    name: "vue3-svg-icons",

    async transform(code, id) {
      const query = parseQuery(id);

      if (!query.vue) return null;
      if (!isIncluded(id)) return null;
      if (query.type !== "template") return null;

      const $ = cheerio.load(code);
      const tag = $("vue3-svg");

      // Checking existance
      if (tag.length === 0) return null;
      options.debug && console.log(`VUE3-SVG - FOUND (${humanlizePath(id)})`);

      const attrs = tag.attr();
      if (!attrs) return null;

      const [name] = Object.keys(attrs);
      const svg = await this.resolve(`./${name}.svg`, id, { skipSelf: true });
      if (!svg) this.error("SVG not found");

      const source = await fs.readFile(svg.id, "utf8");
      options.debug && console.log(`VUE3-SVG - SVG:\n`, source);
      tag.replaceWith(source);

      const newCode = $.html();
      options.debug && console.log(`VUE3-SVG - RESULT:\n`, newCode);

      return { code: newCode };
    },
  };

  return plugin;
};
