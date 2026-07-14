import { existsSync, readFileSync } from "node:fs";

const htmlPath = "examples/demo/index.html";
const issues: string[] = [];

if (!existsSync("dist/index.js")) issues.push("run npm run build first");
if (!existsSync(htmlPath)) issues.push(`missing ${htmlPath}`);

if (existsSync(htmlPath)) {
  const html = readFileSync(htmlPath, "utf8");
  if (!html.includes("../../dist/index.js"))
    issues.push("demo must import the built public entry point");
  if (!html.includes("LivingText"))
    issues.push("demo must exercise the public LivingText API");
  if (html.includes("../src/") && !html.includes("../../src/styles/eyslie.css"))
    issues.push("demo must not import private source internals");
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log("Eyslie demo is valid.");
