import { write } from "./utils";

test("basic", async () => {
  const res = await write({
    input: "basic/index.js",
    outDir: "basic",
    options: {},
  });

  for (const f of await res.js()) expect(f).toMatchSnapshot("js");
  for (const f of await res.svg()) expect(f).toMatchSnapshot("svg");
  await expect(res.isSvg()).resolves.toBeTruthy();
});
