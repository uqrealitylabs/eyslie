import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const htmlPath = "demo-dist/index.html";
const sourcePath = "examples/demo/src/main.tsx";
const stylesPath = "examples/demo/src/styles.css";
const issues: string[] = [];
const expectedBase = process.env.DEMO_BASE_PATH;

if (!existsSync(htmlPath)) issues.push("run npm run demo:build first");
if (!existsSync(sourcePath)) issues.push(`missing ${sourcePath}`);
if (!existsSync(stylesPath)) issues.push(`missing ${stylesPath}`);
if (!existsSync("demo-dist/OFL.txt"))
  issues.push("built demo is missing OFL.txt");

if (existsSync(htmlPath)) {
  const html = readFileSync(htmlPath, "utf8");
  for (const text of ["Eyslie", "assets/"]) {
    if (!html.includes(text)) issues.push(`built demo is missing ${text}`);
  }
  if (html.includes("esm.sh") || html.includes("unpkg.com"))
    issues.push("demo must not use a CDN import map");
  const localUrls = Array.from(
    html.matchAll(/(?:href|src)="([^"]+)"/g),
    ([, url]) => url,
  ).filter((url) => !/^(?:data:|https?:|#)/.test(url));
  for (const url of localUrls) {
    if (expectedBase && !url.startsWith(expectedBase)) {
      issues.push(`built URL must use ${expectedBase}: ${url}`);
      continue;
    }
    const relativePath = expectedBase
      ? url.slice(expectedBase.length)
      : url.replace(/^\/+/, "");
    if (!existsSync(join("demo-dist", relativePath)))
      issues.push(`built URL is missing its file: ${url}`);
  }
}

if (existsSync(sourcePath)) {
  const source = readFileSync(sourcePath, "utf8");
  for (const text of [
    "LivingText",
    "../../../dist/index.js",
    "eyeMarkers",
    "livingTextThemes",
  ]) {
    if (!source.includes(text)) issues.push(`demo source is missing ${text}`);
  }
}

if (existsSync(stylesPath)) {
  const styles = readFileSync(stylesPath, "utf8");
  for (const text of [
    "-webkit-text-stroke",
    ".preset-grid",
    "overflow: auto",
  ]) {
    if (!styles.includes(text)) issues.push(`demo styles are missing ${text}`);
  }
  if (styles.includes(".living-word > *"))
    issues.push("demo must not stretch LivingText away from its glyph bounds");
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log("Eyslie demo build is valid.");
