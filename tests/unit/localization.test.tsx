import type { JsonObject } from "@keys-i/seer";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  type DemoLocaleCatalog,
  resolveThoughtLocale,
} from "../../examples/demo/src/locales.js";
import { LivingText } from "../../src/LivingText.js";
import {
  type LivingTextMood,
  livingTextMoods,
} from "../../src/state/livingTextMachine.js";
import {
  type ExpressionLevel,
  expressionLevels,
} from "../../src/state/livingTextOptions.js";
import {
  loadLocalizedThoughts,
  validateLocalizedThoughts,
} from "../../tools/config/demo-vite.config.js";

const catalog = await loadLocalizedThoughts();

describe("localized thoughts", () => {
  it.each([
    ["ar", "ar"],
    ["ar-EG", "ar"],
    ["EN-au", "en"],
    ["es-419-u-nu-latn", "es"],
    ["ja-JP", "ja"],
    ["zh-CN", "zh-Hans"],
    ["zh-Hans-SG", "zh-Hans"],
    ["en-Latn", "en"],
    ["en-Latn-AU", "en"],
    ["es-Latn", "es"],
    ["ar-Arab-EG", "ar"],
    ["ja-Jpan-JP", "ja"],
    ["ar-Latn", "und"],
    ["en-Cyrl", "und"],
    ["zh-Hant", "und"],
    ["mi-NZ", "und"],
    ["und-AU", "und"],
    ["", "und"],
    ["en_US", "und"],
    ["__proto__", "und"],
    ["constructor", "und"],
    ["toString", "und"],
  ])("resolves %s to %s", (requested, expected) => {
    expect(resolveThoughtLocale(catalog, requested)).toBe(expected);
  });

  it("uses only owned fallbacks and rejects an empty catalog", () => {
    const inherited = Object.assign(Object.create({ en: catalog.en }), {
      und: catalog.und,
    }) as DemoLocaleCatalog;
    expect(resolveThoughtLocale(inherited, "en")).toBe("und");
    expect(resolveThoughtLocale(catalog, "mi-NZ", "en")).toBe("en");
    expect(() => resolveThoughtLocale({}, "en")).toThrow(
      "thought locale catalog is empty",
    );
  });

  it("contains complete, bounded locale packs", () => {
    expect(Object.keys(catalog)).toEqual([
      "ar",
      "en",
      "es",
      "ja",
      "und",
      "zh-Hans",
    ]);
    for (const content of Object.values(catalog)) {
      expect(content.label.trim()).toBe(content.label);
      expect(Object.keys(content.thoughts)).toEqual(expressionLevels);
      for (const thoughts of Object.values(content.thoughts)) {
        expect(Object.keys(thoughts)).toEqual(Object.values(livingTextMoods));
      }
    }
    expect(Object.values(catalog.und.thoughts).flatMap(Object.values)).toEqual(
      Array(21).fill(""),
    );
    expect(catalog.es.thoughts.subtle.recovery).toBe("estoy bien");
  });

  it("keeps equal Spanish phrases distinguishable by announced state", () => {
    const subtle = catalog.es.thoughts.subtle;
    expect(subtle.excited).toBe(subtle.celebration);
    expect(`excited, subtle. ${subtle.excited}`).not.toBe(
      `celebration, subtle. ${subtle.celebration}`,
    );
  });

  it.each<[string, (content: JsonObject) => void, RegExp]>([
    [
      "a missing pack",
      (content: JsonObject) => delete content.eyslie,
      /eyslie must be an object/,
    ],
    [
      "an extra pack key",
      (content: JsonObject) => {
        (content.eyslie as JsonObject).extra = true;
      },
      /must contain exactly label, thoughts/,
    ],
    [
      "a blank label",
      (content: JsonObject) => {
        (content.eyslie as JsonObject).label = " ";
      },
      /label must be non-empty text/,
    ],
    [
      "a missing expression",
      (content: JsonObject) => {
        delete ((content.eyslie as JsonObject).thoughts as JsonObject).subtle;
      },
      /must contain exactly subtle, playful, theatrical/,
    ],
    [
      "an extra mood",
      (content: JsonObject) => {
        const thoughts = (content.eyslie as JsonObject).thoughts as JsonObject;
        (thoughts.subtle as JsonObject).extra = "no";
      },
      /must contain exactly idleCurious/,
    ],
    ...(
      [
        ["a non-string thought", 1],
        ["an empty thought", ""],
        ["outer whitespace", " hello"],
        ["a control character", "hello\n"],
        ["a bidi override", "hello\u202e"],
        ["more than 32 graphemes", "a".repeat(33)],
      ] as const
    ).map(
      ([name, value]) =>
        [
          name,
          (content: JsonObject) => {
            const thoughts = (content.eyslie as JsonObject)
              .thoughts as JsonObject;
            (thoughts.subtle as JsonObject).excited = value;
          },
          /excited must be non-empty text up to 32 graphemes/,
        ] as [string, (content: JsonObject) => void, RegExp],
    ),
    [
      "a non-empty idle thought",
      (content: JsonObject) => {
        const thoughts = (content.eyslie as JsonObject).thoughts as JsonObject;
        (thoughts.subtle as JsonObject).idleCurious = "hello";
      },
      /idleCurious must be empty text/,
    ],
  ])("rejects %s", (_name, change, error) => {
    const content = {
      eyslie: structuredClone(catalog.en),
    } as unknown as JsonObject;
    change(content);
    expect(() => validateLocalizedThoughts(content, "test")).toThrow(error);
  });

  it("allows one joined emoji grapheme", () => {
    const content = {
      eyslie: structuredClone(catalog.en),
    } as unknown as JsonObject;
    const thoughts = (content.eyslie as JsonObject).thoughts as JsonObject;
    (thoughts.subtle as JsonObject).excited = "👨‍👩‍👧‍👦";
    expect(() => validateLocalizedThoughts(content, "test")).not.toThrow();
  });

  it("rejects thoughts in the language-unknown fallback", () => {
    const content = {
      eyslie: structuredClone(catalog.und),
    } as unknown as JsonObject;
    const thoughts = (content.eyslie as JsonObject).thoughts as JsonObject;
    (thoughts.subtle as JsonObject).excited = "!";
    expect(() => validateLocalizedThoughts(content, "und")).toThrow(
      /excited must be empty text/,
    );
  });

  it.each(
    Object.entries(catalog).flatMap(([locale, content]) =>
      expressionLevels.flatMap((expression) =>
        Object.values(livingTextMoods).map(
          (mood) =>
            [locale, expression, mood, content.thoughts[expression][mood]] as [
              string,
              ExpressionLevel,
              LivingTextMood,
              string,
            ],
        ),
      ),
    ),
  )("SSR renders %s/%s/%s", (locale, expression, mood, thought) => {
    const html = renderToString(
      <LivingText
        text="^H>I"
        eyeMarkers
        expression={expression}
        mood={mood}
        thoughts={{ [mood]: thought }}
        thoughtLang={locale === "und" ? undefined : locale}
        reducedMotion
      />,
    );
    expect(html).toContain(`data-mood="${mood}"`);
    if (thought) {
      expect(html).toContain('class="eyslie__thought"');
      expect(html).toContain('dir="auto"');
      expect(html).toContain(`lang="${locale}"`);
      expect(html).toContain(renderToString(thought));
    } else {
      expect(html).not.toContain("eyslie__thought");
    }
  });
});
