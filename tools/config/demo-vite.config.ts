import { type JsonObject, readProject } from "@keys-i/seer";
import { countGraphemes } from "unicode-segmenter/grapheme";
import { defineConfig } from "vite";
import type { DemoLocaleCatalog } from "../../examples/demo/src/locales.js";
import { livingTextMoods } from "../../src/state/livingTextMachine.js";
import { expressionLevels } from "../../src/state/livingTextOptions.js";

const moods = Object.values(livingTextMoods);
const unsafeControls = /[\p{Cc}\u061c\u200e\u200f\u202a-\u202e\u2066-\u2069]/u;

const rawBase = process.env.DEMO_BASE_PATH ?? "/";
const base = rawBase === "/" ? "/" : `/${rawBase.replace(/^\/+|\/+$/g, "")}/`;

export async function loadLocalizedThoughts(): Promise<DemoLocaleCatalog> {
  const project = await readProject({
    dir: new URL("./locales", import.meta.url),
    validate: validateLocalizedThoughts,
  });

  return Object.fromEntries(
    project.locales.map((locale) => [locale, project.content[locale]?.eyslie]),
  ) as DemoLocaleCatalog;
}

export default defineConfig(async () => ({
  root: "examples/demo",
  base,
  define: {
    __EYSLIE_LOCALES__: JSON.stringify(await loadLocalizedThoughts()),
  },
  build: {
    outDir: "../../demo-dist",
    emptyOutDir: true,
  },
  server: {
    host: "127.0.0.1",
    port: Number(process.env.PORT ?? 4173),
  },
}));

export function validateLocalizedThoughts(content: JsonObject, locale: string) {
  const pack = object(content.eyslie, `${locale}.eyslie`);
  exactKeys(pack, ["label", "thoughts"], `${locale}.eyslie`);
  text(pack.label, `${locale}.eyslie.label`, 40, false);
  const thoughts = object(pack.thoughts, `${locale}.eyslie.thoughts`);
  exactKeys(thoughts, expressionLevels, `${locale}.eyslie.thoughts`);
  for (const expression of expressionLevels) {
    const values = object(
      thoughts[expression],
      `${locale}.eyslie.thoughts.${expression}`,
    );
    exactKeys(values, moods, `${locale}.eyslie.thoughts.${expression}`);
    for (const mood of moods) {
      text(
        values[mood],
        `${locale}.eyslie.thoughts.${expression}.${mood}`,
        32,
        locale === "und" || mood === livingTextMoods.idleCurious,
      );
    }
  }
}

function object(value: unknown, path: string): JsonObject {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${path} must be an object`);
  }
  return value as JsonObject;
}

function exactKeys(
  value: JsonObject,
  expected: readonly string[],
  path: string,
) {
  const actual = Object.keys(value);
  if (
    actual.length !== expected.length ||
    expected.some((key) => !Object.hasOwn(value, key))
  ) {
    throw new Error(`${path} must contain exactly ${expected.join(", ")}`);
  }
}

function text(
  value: unknown,
  path: string,
  maxGraphemes: number,
  empty: boolean,
) {
  if (
    typeof value !== "string" ||
    value !== value.trim() ||
    unsafeControls.test(value) ||
    countGraphemes(value) > maxGraphemes ||
    (empty ? value : !value)
  ) {
    throw new Error(
      `${path} must be ${empty ? "empty" : "non-empty"} text up to ${maxGraphemes} graphemes`,
    );
  }
}
