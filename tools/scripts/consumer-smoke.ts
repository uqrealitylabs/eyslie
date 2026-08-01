import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = process.cwd();
const scratch = mkdtempSync(join(tmpdir(), "eyslie-consumer-"));
process.on("exit", () => rmSync(scratch, { recursive: true, force: true }));
const tarball = process.env.PACKAGE_TARBALL
  ? resolve(process.env.PACKAGE_TARBALL)
  : join(
      scratch,
      execFileSync(
        "npm",
        ["pack", "--silent", "--ignore-scripts", "--pack-destination", scratch],
        { cwd: root, encoding: "utf8" },
      ).trim(),
    );
if (!statSync(tarball).isFile()) throw new Error(`Missing tarball: ${tarball}`);
const reactVersions = ["18.3.1", "19.2.8"];

for (const [index, reactVersion] of reactVersions.entries()) {
  const isLatest = index === reactVersions.length - 1;
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
      tarball,
      `react@${reactVersion}`,
      `react-dom@${reactVersion}`,
      "jsdom@26.1.0",
      ...(isLatest ? ["typescript@5.9.3"] : []),
    ],
    { cwd: consumer, stdio: "inherit" },
  );
  const smoke = join(consumer, "smoke.mjs");
  writeFileSync(
    smoke,
    [
      'import React, { act } from "react";',
      'import { renderToString } from "react-dom/server";',
      'import { JSDOM } from "jsdom";',
      'import { LivingText } from "@uqrealitylabs/eyslie";',
      "const cases = [",
      '  ["default", { text: "JOIN US" }],',
      '  ["unicode", { text: "O e\\u0301 🇦🇺 U", ariaLabel: "Unicode eyes", className: "demo", mood: "blush", thoughts: { blush: "hello" }, style: { color: "rebeccapurple" }, reducedMotion: true, eyeLetters: { primary: "É", secondary: "U" } }],',
      '  ["empty", { text: "" }],',
      '  ["whitespace", { text: " \\n\\t" }],',
      '  ["invalid anchors", { text: "JOIN US", eyeLetters: { primary: -1, secondary: 99 } }],',
      '  ["extreme seed", { text: "JOIN US", seed: Number.MAX_VALUE }],',
      "];",
      "const rendered = cases.map(([name, props]) => [name, props, renderToString(React.createElement(LivingText, props))]);",
      'const dom = new JSDOM("<!doctype html><div id=\\"root\\"></div>", { pretendToBeVisual: true });',
      "globalThis.window = dom.window;",
      "globalThis.document = dom.window.document;",
      "globalThis.IS_REACT_ACT_ENVIRONMENT = true;",
      "const failures = [];",
      "const originalError = console.error;",
      "const originalWarn = console.warn;",
      'console.error = console.warn = (...args) => failures.push(args.map(String).join(" "));',
      'const { hydrateRoot } = await import("react-dom/client");',
      "try {",
      "  for (const [name, props, html] of rendered) {",
      "    const element = React.createElement(LivingText, props);",
      '    const container = document.getElementById("root");',
      "    container.innerHTML = html;",
      "    let root;",
      "    await act(() => {",
      "      root = hydrateRoot(container, element, {",
      '        onRecoverableError: (error) => failures.push(name + ": " + String(error)),',
      "      });",
      "    });",
      "    await act(() => root.unmount());",
      "  }",
      "} finally {",
      "  console.error = originalError;",
      "  console.warn = originalWarn;",
      "  dom.window.close();",
      "}",
      'if (failures.length) throw new Error("Hydration failed:\\n" + failures.join("\\n"));',
    ].join("\n"),
  );
  execFileSync("node", [smoke], { cwd: consumer, stdio: "inherit" });
  if (isLatest) {
    const types = join(consumer, "types.ts");
    writeFileSync(
      types,
      [
        'import { LivingText, type LivingTextProps } from "@uqrealitylabs/eyslie";',
        'const props: LivingTextProps = { text: "JOIN US" };',
        "void [LivingText, props];",
      ].join("\n"),
    );
    for (const resolution of ["node", "bundler"]) {
      execFileSync(
        process.execPath,
        [
          join(consumer, "node_modules", "typescript", "bin", "tsc"),
          types,
          "--module",
          "ESNext",
          "--moduleResolution",
          resolution,
          "--target",
          "ES2022",
          "--strict",
          "--skipLibCheck",
          "--noEmit",
        ],
        { cwd: consumer, stdio: "inherit" },
      );
    }
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
}
