import { existsSync, readFileSync } from "node:fs";

const htmlPath = "demo-dist/index.html";
const sourcePath = "examples/demo/src/main.tsx";
const issues: string[] = [];
const expectedBase = process.env.DEMO_BASE_PATH;

if (!existsSync(htmlPath)) issues.push("run npm run demo:build first");
if (!existsSync(sourcePath)) issues.push(`missing ${sourcePath}`);

if (existsSync(htmlPath)) {
  const html = readFileSync(htmlPath, "utf8");
  for (const text of ["Eyslie", "assets/"]) {
    if (!html.includes(text)) issues.push(`built demo is missing ${text}`);
  }
  if (html.includes("esm.sh") || html.includes("unpkg.com"))
    issues.push("demo must not use a CDN import map");
  if (expectedBase && !html.includes(expectedBase))
    issues.push(`built assets must use ${expectedBase}`);
}

if (existsSync(sourcePath)) {
  const source = readFileSync(sourcePath, "utf8");
  for (const text of ["LivingText", "../../../dist/index.js"]) {
    if (!source.includes(text)) issues.push(`demo source is missing ${text}`);
  }
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log("Eyslie demo build is valid.");
