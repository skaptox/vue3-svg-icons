import { createFilter } from "@rollup/pluginutils";
import { Options } from "./types";
import { parseQuery } from "./utils";
import { Plugin } from "rollup";
import cheerio from "cheerio";
import fs from "fs-extra";

// helper functions
const createSymbol = (code: string, name: string) => {
  const markup = cheerio.load(code, { xmlMode: true });
  const svgMarkup = markup("svg");
  const symbolId = name;

  markup("svg").replaceWith("<symbol/>");
  markup("symbol")
    .attr("id", symbolId)
    .attr("viewBox", svgMarkup.attr("viewBox") as string)
    .append(svgMarkup.children());

  console.log("SAVING SYMBOL WITH CODE", markup.xml("symbol"));
  return markup.xml("symbol");
};

interface TSymbol {
  bundle: string;
  code: string;
}

const createSprite = (bundle: string, _symbols: Array<TSymbol>) => {
  const symbols = _symbols.filter(symbol => symbol.bundle === bundle).map(symbol => symbol.code);
  return `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join("")}</svg>`;
};

// plugin
export default (options: Options = {}): Plugin => {
  const isIncluded = createFilter(options.include, options.exclude);
  const bundles = new Set();
  const symbols: Array<TSymbol> = [];

  const plugin: Plugin = {
    name: "vue3-svg-icons",

    transform(code: string, id: string) {
      const query = parseQuery(id);

      if (!query.vue) return null;
      if (!isIncluded(id)) return null;
      if (query.type !== "template") return null;

      const $ = cheerio.load(code);
      const tags = $("v-icon");

      // skip if no tags
      if (tags.length === 0) return null;

      tags.map(async (_, tag) => {
        if (!tag.attribs) return;

        const file = await this.resolve(tag.attribs.src, id, {
          skipSelf: true,
        });
        if (!file) this.error("SVG FILE NOT FOUND");

        const svgSource = await fs.readFile(file.id, "utf8");

        // register bundle
        bundles.add(tag.attribs.bundle);

        // register symbol
        symbols.push({
          bundle: tag.attribs.bundle,
          code: createSymbol(svgSource, tag.attribs.name),
        });
      });

      return { code };
    },

    generateBundle() {
      [...bundles].map(bundle => {
        this.emitFile({
          type: "asset",
          fileName: `${bundle as string}.svg`,
          source: createSprite(bundle as string, symbols),
        });
      });
    },
  };
  return plugin;
};
