import fs from "fs-extra";
import { Plugin } from "rollup";
import { createFilter } from "@rollup/pluginutils";
import {
  serialize,
  parseFragment,
  DefaultTreeElement,
  DefaultTreeDocumentFragment,
  DefaultTreeNode,
} from "parse5";
// import { inspect } from "util";

import { Options } from "./types";
import { parseQuery } from "./utils";

export default (options: Options = {}): Plugin => {
  const isIncluded = createFilter(options.include, options.exclude);

  const plugin: Plugin = {
    name: "vue3-svg-icons",
    async transform(code, id) {
      const query = parseQuery(id);

      if (!query.vue) return null;
      if (!isIncluded(id)) return null;
      if (query.type !== "template") return null;

      const ast = parseFragment(code) as DefaultTreeDocumentFragment;
      // console.log(inspect(ast, { depth: null, maxArrayLength: null }));

      const newChildNodes: DefaultTreeNode[] = [];
      for await (const node of ast.childNodes as DefaultTreeElement[]) {
        // Skip unrelated tags
        if (node.nodeName !== "vue3-svg") {
          newChildNodes.push(node);
          continue;
        }

        if (!node.attrs || node.attrs.length === 0) this.error("Attribute required");
        if (node.attrs.length !== 1) this.error("Only one attribute allowed");

        const { name } = node.attrs[0];
        const svg = await this.resolve(`./${name}`, id, { skipSelf: true });
        if (!svg) this.error("Could not find SVG");

        const source = await fs.readFile(svg.id, "utf8");
        const { childNodes } = parseFragment(source) as DefaultTreeDocumentFragment;
        newChildNodes.push(...childNodes);
      }

      ast.childNodes = newChildNodes;
      return serialize(ast);
    },
  };

  return plugin;
};
