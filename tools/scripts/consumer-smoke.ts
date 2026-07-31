import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const scratch = mkdtempSync(join(tmpdir(), "eyslie-consumer-"));
const { devDependencies } = JSON.parse(
  readFileSync("package.json", "utf8"),
) as { devDependencies: Record<string, string> };
const filename = execFileSync(
  "npm",
  [
    "pack",
    "--silent",
    "--ignore-scripts",
    "--pack-destination",
    scratch,
    "--cache",
    join(scratch, "cache"),
  ],
  { cwd: root, encoding: "utf8" },
).trim();
const tarball = join(scratch, filename);

for (const reactVersion of [
  "18.3.1",
  devDependencies.react.replace(/^\D+/, ""),
]) {
  const consumer = join(scratch, `react-${reactVersion}`);
  mkdirSync(consumer);
  writeFileSync(
    join(consumer, "package.json"),
    JSON.stringify({ type: "module", dependencies: {} }, null, 2),
  );
  execFileSync(
    "npm",
    [
      "install",
      "--ignore-scripts",
      "--cache",
      join(scratch, "cache"),
      tarball,
      `react@${reactVersion}`,
      `react-dom@${reactVersion}`,
    ],
    { cwd: consumer, stdio: "inherit" },
  );
  execFileSync(
    "node",
    [
      "--input-type=module",
      "--eval",
      [
        'import React from "react";',
        'import { renderToString } from "react-dom/server";',
        'import { LivingText, getOrganicWinkDelayMs } from "@uqrealitylabs/eyslie";',
        'const html = renderToString(React.createElement(LivingText, { text: "JOIN US", reducedMotion: true }));',
        `if (!html.includes('aria-label="JOIN US"')) throw new Error("SSR render broken");`,
        'if ((html.match(/data-eye-role/g) ?? []).length !== 2) throw new Error("eye render broken");',
        "if (getOrganicWinkDelayMs(1, 0) < 2600) throw new Error('wink export broken');",
      ].join("\n"),
    ],
    { cwd: consumer, stdio: "inherit" },
  );
  statSync(
    join(
      consumer,
      "node_modules",
      "@uqrealitylabs",
      "eyslie",
      "src",
      "styles",
      "eyslie.css",
    ),
  );
}
