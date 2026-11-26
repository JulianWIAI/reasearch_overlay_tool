import { build } from "esbuild";

await build({
  entryPoints: ["src/content-entry.js"],
  outfile: "content.js",
  bundle: true,
  format: "iife",
  platform: "browser",
  target: ["chrome114", "edge114"],
  minify: true,
  legalComments: "none"
});
