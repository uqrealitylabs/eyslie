import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

const buildPath = "../../dist/index.js";
const { LivingText, parseEyeMarkers } = (await import(
  buildPath
)) as typeof import("../../src/index.js");

const markedText = "W^O>W! <🙂 \\^";
const defaultView = createElement(LivingText, { text: "JOIN US" });
const markedView = createElement(LivingText, {
  text: markedText,
  eyeMarkers: true,
  mood: "excited",
  eyeShape: "star",
  theme: "tinyGalaxy",
  mouth: "auto",
});
const emojiView = createElement(LivingText, {
  text: "^👁️",
  eyeMarkers: true,
  eyeShape: "diamond",
  eyeStyle: "gloss",
  gaze: "wander",
  mouth: "auto",
});

const results = {
  parse: measure(20_000, () => parseEyeMarkers(markedText)),
  ssrDefault: measure(1_000, () => renderToString(defaultView)),
  ssrMarked: measure(1_000, () => renderToString(markedView)),
  ssrEmoji: measure(1_000, () => renderToString(emojiView)),
  output: {
    defaultHtmlBytes: Buffer.byteLength(renderToString(defaultView)),
    distBytes: directorySize("dist") + statSync("src/styles/eyslie.css").size,
  },
};

console.log(JSON.stringify(results, null, 2));

function measure(iterations: number, run: () => unknown) {
  for (let index = 0; index < 100; index += 1) run();
  const samples = Array.from({ length: 9 }, () => {
    const start = performance.now();
    for (let index = 0; index < iterations; index += 1) run();
    return performance.now() - start;
  }).sort((left, right) => left - right);
  const medianMs = samples[4] ?? 0;
  return {
    iterations,
    medianMs: Number(medianMs.toFixed(2)),
    operationsPerSecond: Math.round(iterations / (medianMs / 1000)),
  };
}

function directorySize(path: string): number {
  return readdirSync(path, { withFileTypes: true }).reduce(
    (total, entry) =>
      total +
      (entry.isDirectory()
        ? directorySize(join(path, entry.name))
        : statSync(join(path, entry.name)).size),
    0,
  );
}
