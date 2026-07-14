import { execFileSync } from "node:child_process";
import { mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = process.cwd();
const scratch = mkdtempSync(join(tmpdir(), "eyslie-consumer-"));
const packOutput = execFileSync(
  "npm",
  [
    "pack",
    "--json",
    "--pack-destination",
    scratch,
    "--cache",
    join(scratch, "cache"),
  ],
  { cwd: root, encoding: "utf8" },
);
const [{ filename }] = JSON.parse(packOutput) as [{ filename: string }];
const tarball = join(scratch, filename);

writeFileSync(
  join(scratch, "package.json"),
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
    "react@19.2.1",
  ],
  { cwd: scratch, stdio: "inherit" },
);

execFileSync(
  "node",
  [
    "--input-type=module",
    "--eval",
    [
      'import { LivingText, getOrganicWinkDelayMs } from "@uqrealitylabs/eyslie";',
      'if (typeof LivingText !== "function") throw new Error("LivingText export missing");',
      "if (getOrganicWinkDelayMs(1, 0) < 2600) throw new Error('wink export broken');",
    ].join("\n"),
  ],
  { cwd: scratch, stdio: "inherit" },
);

statSync(
  join(
    scratch,
    "node_modules",
    "@uqrealitylabs",
    "eyslie",
    "src",
    "styles",
    "eyslie.css",
  ),
);
