import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = process.cwd();
const scratch = mkdtempSync(join(tmpdir(), "eyslie-consumer-"));
const npmCacheArgs = ["--cache", join(scratch, "npm-cache")];
process.on("exit", () => rmSync(scratch, { recursive: true, force: true }));
const suppliedTarball = process.env.PACKAGE_TARBALL;
if (!suppliedTarball) {
  execFileSync("npm", ["run", "build"], { cwd: root, stdio: "inherit" });
}
const tarball = suppliedTarball
  ? resolve(suppliedTarball)
  : join(
      scratch,
      execFileSync(
        "npm",
        [
          "pack",
          "--silent",
          "--ignore-scripts",
          "--pack-destination",
          scratch,
          ...npmCacheArgs,
        ],
        { cwd: root, encoding: "utf8" },
      ).trim(),
    );
if (!statSync(tarball).isFile()) throw new Error(`Missing tarball: ${tarball}`);

const versions = [
  {
    react: "18.0.0",
    reactTypes: "18.3.28",
    reactDomTypes: "18.3.7",
  },
  { react: "19.2.8", reactTypes: "19.2.18", reactDomTypes: "19.2.4" },
];

for (const [index, version] of versions.entries()) {
  const isLatest = index === versions.length - 1;
  const consumer = join(scratch, `react-${version.react}`);
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
      "--allow-git=none",
      "--no-fund",
      tarball,
      `react@${version.react}`,
      `react-dom@${version.react}`,
      `@types/react@${version.reactTypes}`,
      `@types/react-dom@${version.reactDomTypes}`,
      "jsdom@26.1.0",
      "typescript@5.9.3",
      ...npmCacheArgs,
    ],
    { cwd: consumer, stdio: "inherit" },
  );

  const smoke = join(consumer, "smoke.mjs");
  writeFileSync(
    smoke,
    [
      'import * as React from "react";',
      'import { renderToString } from "react-dom/server";',
      'import { JSDOM } from "jsdom";',
      'import { LivingText } from "@uqrealitylabs/eyslie";',
      "const cases = [",
      '  ["default", { text: "JOIN US" }],',
      '  ["unicode", { text: "O e\\u0301 🇦🇺 U", ariaLabel: "Unicode eyes", className: "demo", mood: "blush", thoughts: { blush: "hello" }, style: { color: "rebeccapurple" }, reducedMotion: true, eyeLetters: { primary: "É", secondary: "U" } }],',
      '  ["empty", { text: "" }],',
      '  ["whitespace", { text: " \\n\\t" }],',
      '  ["markup", { text: "</span><script>alert(1)</script>" }],',
      '  ["invalid anchors", { text: "JOIN US", eyeLetters: { primary: -1, secondary: 99 } }],',
      '  ["extreme seed", { text: "JOIN US", seed: Number.MAX_VALUE }],',
      "];",
      "const view = (props) => React.createElement(React.StrictMode, null, React.createElement(LivingText, props));",
      "const rendered = cases.map(([name, props]) => [name, props, renderToString(view(props))]);",
      'const dom = new JSDOM("<!doctype html><div id=\\"root\\"></div>", { pretendToBeVisual: true });',
      "globalThis.window = dom.window;",
      "globalThis.document = dom.window.document;",
      "globalThis.IS_REACT_ACT_ENVIRONMENT = true;",
      "const failures = [];",
      "const originalError = console.error;",
      "const originalWarn = console.warn;",
      'console.error = console.warn = (...args) => failures.push(args.map(String).join(" "));',
      'const { act } = React.act ? React : await import("react-dom/test-utils");',
      'const { createRoot, hydrateRoot } = await import("react-dom/client");',
      "try {",
      "  for (const [name, props, html] of rendered) {",
      '    if (html.includes("<script>")) failures.push(name + ": unescaped markup");',
      "    const element = view(props);",
      '    const container = document.getElementById("root");',
      "    container.innerHTML = html;",
      "    let root;",
      "    await act(() => {",
      "      root = hydrateRoot(container, element, {",
      '        onRecoverableError: (error) => failures.push(name + ": " + String(error)),',
      "      });",
      "    });",
      "    await act(() => root.unmount());",
      "    await act(() => {",
      "      root = createRoot(container);",
      "      root.render(element);",
      "    });",
      '    if (!container.querySelector(".eyslie")) failures.push(name + ": CSR root missing");',
      "    await act(() => root.unmount());",
      "  }",
      "} finally {",
      "  console.error = originalError;",
      "  console.warn = originalWarn;",
      "  dom.window.close();",
      "}",
      'if (failures.length) throw new Error("Render smoke failed:\\n" + failures.join("\\n"));',
    ].join("\n"),
  );
  execFileSync("node", [smoke], { cwd: consumer, stdio: "inherit" });

  const types = join(consumer, "types.tsx");
  writeFileSync(
    types,
    [
      'import { LivingText, type LivingTextProps } from "@uqrealitylabs/eyslie";',
      'const props: LivingTextProps = { text: "JOIN US" };',
      "const view = <LivingText {...props} />;",
      "void [LivingText, props, view];",
    ].join("\n"),
  );
  for (const [module, resolution] of [
    ["ESNext", "node"],
    ["ESNext", "bundler"],
    ["NodeNext", "nodenext"],
  ]) {
    execFileSync(
      process.execPath,
      [
        join(consumer, "node_modules", "typescript", "bin", "tsc"),
        types,
        "--module",
        module,
        "--moduleResolution",
        resolution,
        "--target",
        "ES2022",
        "--jsx",
        "react-jsx",
        "--strict",
        "--noEmit",
      ],
      { cwd: consumer, stdio: "inherit" },
    );
  }

  if (isLatest) {
    const packageRoot = join(
      consumer,
      "node_modules",
      "@uqrealitylabs",
      "eyslie",
    );
    statSync(join(packageRoot, "src", "styles", "eyslie.css"));
    if (
      /^["']use client/.test(
        readFileSync(join(packageRoot, "dist", "index.js"), "utf8"),
      )
    ) {
      throw new Error(
        "Package root must keep server helpers outside the client boundary",
      );
    }
    execFileSync(
      process.execPath,
      [
        "--conditions=react-server",
        "--input-type=module",
        "-e",
        'const p = await import("@uqrealitylabs/eyslie"); if (p.splitTextLetters("O🙂").length !== 2 || !p.isPointerNear({ left: 0, top: 0, right: 1, bottom: 1 }, { x: 0, y: 0 }, 0)) throw new Error("server helpers unavailable");',
      ],
      { cwd: consumer, stdio: "inherit" },
    );
    for (const entry of [
      "LivingText.js",
      "hooks/useEyeTracking.js",
      "hooks/useProximity.js",
      "hooks/useRandomWink.js",
    ]) {
      if (
        !/^["']use client/.test(
          readFileSync(join(packageRoot, "dist", entry), "utf8"),
        )
      ) {
        throw new Error(`${entry} must remain a client entry point`);
      }
    }
  }
}
