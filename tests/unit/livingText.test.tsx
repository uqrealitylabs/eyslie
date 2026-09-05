import { readFileSync } from "node:fs";
import { renderToString } from "react-dom/server";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  Blush,
  blinkBehaviors,
  constrainPupilOffset,
  createWinkSchedule,
  expressionLevels,
  eyeShapes,
  eyeStyles,
  gazeBehaviors,
  getCheekAnchors,
  getExpressionLevel,
  getOrganicWinkDelayMs,
  getPupilOffsetFromRect,
  getThoughtForMood,
  isEyeEmoji,
  isPointerNear,
  LetterEye,
  LIVING_TEXT_BLUSH_DELAY_MS,
  LivingText,
  type LivingTextEvent,
  type LivingTextMood,
  type LivingTextProps,
  livingTextMoods,
  livingTextThemes,
  mouthStyles,
  nextLivingTextMood,
  parseEyeMarkers,
  shouldShowBlush,
  splitTextLetters,
  ThoughtBubble,
  thoughtBubbleStyles,
  useEyeTracking,
  useProximity,
  useRandomWink,
} from "../../src";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

describe("state and text", () => {
  it.each([
    ["idleCurious", "pointerNear", 0, "nearStartled"],
    ["nearStartled", "pointerAway", 0, "idleCurious"],
    ["idleCurious", "excite", 0, "excited"],
    ["excited", "blushElapsed", LIVING_TEXT_BLUSH_DELAY_MS - 1, "excited"],
    ["excited", "blushElapsed", LIVING_TEXT_BLUSH_DELAY_MS, "blush"],
    ["blush", "celebrate", 0, "celebration"],
    ["excited", "sadden", 0, "sadShrivel"],
    ["sadShrivel", "recover", 0, "idleCurious"],
    ["blush", "pointerNear", 0, "blush"],
  ] as Array<[LivingTextMood, LivingTextEvent, number, LivingTextMood]>)(
    "moves %s on %s",
    (mood, event, elapsed, expected) => {
      expect(nextLivingTextMood(mood, event, elapsed)).toBe(expected);
    },
  );

  it.each([
    [LIVING_TEXT_BLUSH_DELAY_MS - 1, false],
    [LIVING_TEXT_BLUSH_DELAY_MS, true],
  ])("checks blush threshold %i", (elapsed, expected) => {
    expect(shouldShowBlush(elapsed)).toBe(expected);
  });

  it("merges thought overrides with defaults", () => {
    expect(getThoughtForMood(livingTextMoods.nearStartled, {})).toBe("AWWWW");
    expect(
      getThoughtForMood(livingTextMoods.celebration, {
        celebration: "hooray",
      }),
    ).toBe("hooray");
    expect(
      getThoughtForMood(livingTextMoods.celebration, { celebration: "" }),
    ).toBe("");
    expect(getThoughtForMood(livingTextMoods.idleCurious)).toBe("");
  });

  it.each([
    [0, "subtle"],
    [0.49, "subtle"],
    [0.5, "playful"],
    [1, "playful"],
    [1.5, "theatrical"],
    [2, "theatrical"],
    [-1, "subtle"],
    [3, "theatrical"],
    [NaN, "playful"],
    [Infinity, "playful"],
  ])("resolves expression intensity %s to %s", (intensity, expected) => {
    expect(getExpressionLevel(intensity)).toBe(expected);
  });

  it.each([
    ["👁", true],
    ["👁️", true],
    ["👀", false],
    ["👁️‍🗨️", false],
    ["O", false],
  ])("recognizes eye emoji %s", (grapheme, expected) => {
    expect(isEyeEmoji(grapheme)).toBe(expected);
  });

  it.each(["__proto__", "constructor", "toString", "missing"])(
    "ignores the hostile runtime mood %s",
    (mood) => {
      expect(
        getThoughtForMood(mood as LivingTextMood, {
          [mood]: {} as string,
        }),
      ).toBe("");
      expect(() =>
        renderToString(<LivingText text="O" mood={mood as LivingTextMood} />),
      ).not.toThrow();
    },
  );

  it.each([
    ["", []],
    ["JOIN US", ["J", "O", "I", "N", " ", "U", "S"]],
    ["O🙂", ["O", "🙂"]],
    ["e\u0301", ["e\u0301"]],
    ["🇦🇺", ["🇦🇺"]],
    ["👍🏽", ["👍🏽"]],
    ["👨‍👩‍👧‍👦", ["👨‍👩‍👧‍👦"]],
    ["\r\n", ["\r\n"]],
    ["\ud800", ["\ud800"]],
    ["क्ष", ["क्ष"]],
  ])("segments graphemes in %s", (text, expected) => {
    expect(splitTextLetters(text)).toEqual(expected);
  });

  it.each([
    [
      "W^O>W!",
      "WOW!",
      [
        { index: 1, gaze: "up" },
        { index: 2, gaze: "right" },
      ],
    ],
    ["<🙂", "🙂", [{ index: 0, gaze: "left" }]],
    ["<^>A", "A", [{ index: 0, gaze: "right" }]],
    ["^e\u0301", "e\u0301", [{ index: 0, gaze: "up" }]],
    ["<🇦🇺", "🇦🇺", [{ index: 0, gaze: "left" }]],
    ["^\\>", ">", [{ index: 0, gaze: "up" }]],
    ["\\< \\^ \\> \\\\", "< ^ > \\", []],
    ["A^", "A^", []],
    ["A^^", "A^^", []],
    ["A\\", "A\\", []],
    ["^ ", " ", [{ index: 0, gaze: "up" }]],
    ["plain", "plain", []],
    ["", "", []],
  ] as const)("parses eye markers in %s", (source, text, eyes) => {
    expect(parseEyeMarkers(source)).toEqual({
      text,
      letters: splitTextLetters(text),
      eyes,
    });
  });

  it.each([
    [[], null],
    [[" ", "\n"], null],
    [["A"], { left: 0, right: 0 }],
    [["A", "B"], { left: 0, right: 1 }],
    [["A", "B", "C"], { left: 1, right: 1 }],
    [["A", "B", "C", "D"], { left: 1, right: 2 }],
    [[" ", "🙂", " ", "🇦🇺", " "], { left: 1, right: 3 }],
  ])("anchors cheeks near the visible edges in %j", (letters, expected) => {
    expect(getCheekAnchors(letters)).toEqual(expected);
  });
});

describe("geometry", () => {
  it.each([
    [{ left: 10, top: 10, right: 50, bottom: 40 }, { x: 2, y: 10 }, 8, true],
    [{ left: 10, top: 10, right: 50, bottom: 40 }, { x: 9, y: 10 }, -8, false],
    [{ left: 10, top: 10, right: 50, bottom: 40 }, { x: 10, y: 10 }, NaN, true],
    [{ left: 10, top: 10, right: 50, bottom: 40 }, { x: 51, y: 10 }, 0, false],
  ])("checks pointer proximity", (rect, point, radius, expected) => {
    expect(isPointerNear(rect, point, radius)).toBe(expected);
  });

  it("constrains pupils to an ellipse", () => {
    expect(constrainPupilOffset(0, 0, { width: 20, height: 16 })).toEqual({
      x: 0,
      y: 0,
    });
    const offset = constrainPupilOffset(100, -80, {
      width: 20,
      height: 16,
    });
    expect(Math.hypot(offset.x / 3.6, offset.y / 1.44)).toBeCloseTo(1);
    expect(
      getPupilOffsetFromRect(
        { x: 10, y: 8 },
        { left: 0, top: 0, width: 20, height: 16 },
      ),
    ).toEqual({ x: 0, y: 0 });
  });

  it.each([
    [1, 1, { width: 0, height: 10 }],
    [1, 1, { width: 10, height: 0 }],
    [NaN, 1, { width: 10, height: 10 }],
    [1, NaN, { width: 10, height: 10 }],
    [1, 1, { width: Infinity, height: 10 }],
    [1, 1, { width: 10, height: Infinity }],
  ])("neutralizes invalid pupil geometry", (x, y, bounds) => {
    expect(constrainPupilOffset(x, y, bounds)).toEqual({ x: 0, y: 0 });
  });
});

describe("wink timing", () => {
  it("is deterministic", () => {
    const schedule = createWinkSchedule(12);
    expect(schedule(0)).toBe(getOrganicWinkDelayMs(12, 0));
    expect(schedule(0)).not.toBe(schedule(1));
  });

  it.each([
    [12, 0],
    [NaN, Infinity],
    [Number.MAX_VALUE, Number.MAX_VALUE],
    [-Number.MAX_VALUE, -Number.MAX_VALUE],
  ])("bounds the delay for seed $0 and index $1", (seed, winkIndex) => {
    const delay = getOrganicWinkDelayMs(seed, winkIndex);
    expect(Number.isFinite(delay)).toBe(true);
    expect(delay).toBeGreaterThanOrEqual(2600);
    expect(delay).toBeLessThanOrEqual(6200);
  });

  it("uses one timer for each wait and wink pulse", () => {
    vi.useFakeTimers();
    const previousWindow = globalThis.window;
    globalThis.window = { setTimeout, clearTimeout } as unknown as Window &
      typeof globalThis;
    const states: ReturnType<typeof useRandomWink>[] = [];

    function Host({ disabled = false }: { disabled?: boolean }) {
      states.push(useRandomWink({ seed: 12, disabled }));
      return null;
    }
    function DefaultHost() {
      states.push(useRandomWink({ disabled: true }));
      return null;
    }

    let renderer: ReturnType<typeof create> | undefined;
    act(() => {
      renderer = create(<Host />);
    });
    act(() => {
      vi.advanceTimersByTime(states.at(-1)?.nextDelayMs ?? 0);
    });
    expect(states.at(-1)).toMatchObject({ isWinking: true, winkIndex: 1 });
    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(states.at(-1)?.isWinking).toBe(false);
    act(() => renderer?.update(<Host disabled />));
    expect(states.at(-1)?.isWinking).toBe(false);
    act(() => renderer?.unmount());

    globalThis.window = previousWindow;
    act(() => {
      renderer = create(<Host />);
      create(<DefaultHost />);
    });
    act(() => renderer?.unmount());
    vi.useRealTimers();
  });
});

describe("rendering", () => {
  it("renders decorative pieces without overriding inherited pupil tracking", () => {
    expect(Blush({ active: false })).toBeNull();
    expect(Blush({ active: true })).toMatchObject({
      props: { className: "eyslie__blush", "aria-hidden": "true" },
    });
    expect(Blush({ active: true, side: "left" })).toMatchObject({
      props: {
        className: "eyslie__cheek",
        "data-side": "left",
        "aria-hidden": "true",
      },
    });
    expect(ThoughtBubble({ children: "" })).toBeNull();
    expect(
      ThoughtBubble({ children: "yay", lang: "en", variant: "pixel" }),
    ).toMatchObject({
      props: {
        className: "eyslie__thought",
        "data-bubble-style": "pixel",
        dir: "auto",
        lang: "en",
        "aria-hidden": "true",
      },
    });
    expect(LetterEye({ letter: "O" }).props).not.toHaveProperty("style");
    expect(
      LetterEye({
        letter: "👁️",
        eyeRole: "secondary",
        eyeIndex: 4,
        restGaze: "left",
        blushSides: ["right"],
        winking: true,
      }),
    ).toMatchObject({
      props: {
        "data-eye-role": "secondary",
        "data-eye-index": 4,
        "data-rest-gaze": undefined,
        "data-eye-emoji": "true",
        "data-winking": "true",
      },
    });
  });

  it.each([
    [{ text: "JOIN US" }, 2],
    [{ text: "JOIN US", eyeLetters: {} }, 0],
    [{ text: "JOIN US", eyeLetters: { primary: 1, secondary: 1 } }, 1],
    [{ text: "JOIN US", eyeLetters: { primary: -1, secondary: 99 } }, 0],
    [{ text: "JOIN US", eyeLetters: { primary: -1, secondary: 5 } }, 1],
    [
      { text: "JOIN US", eyeLetters: { primary: 1.5, secondary: undefined } },
      0,
    ],
    [{ text: "join us", eyeLetters: { primary: "O", secondary: "u" } }, 2],
    [{ text: "e\u0301", eyeLetters: { primary: "É" } }, 1],
    [{ text: "👁" }, 1],
    [{ text: "👁️" }, 1],
    [{ text: "O👁️U" }, 3],
    [{ text: "" }, 0],
  ])("renders valid eye anchors for $0", (props, eyeCount) => {
    const html = renderToString(<LivingText {...props} />);
    expect(html.match(/data-eye-role/g) ?? []).toHaveLength(eyeCount);
  });

  it.each([
    ["W^O>W!", 2, "WOW!"],
    ["<A^B>C", 3, "ABC"],
    ["^🙂", 1, "🙂"],
    ["\\^", 0, "^"],
    ["A>", 0, "A&gt;"],
    ["", 0, ""],
  ])("renders inline eyes for %s", (text, eyeCount, label) => {
    const html = renderToString(
      <LivingText
        text={text}
        eyeMarkers
        eyeLetters={{ primary: 0, secondary: 1 }}
      />,
    );
    expect(html.match(/data-eye-role/g) ?? []).toHaveLength(eyeCount);
    if (label) expect(html).toContain(`aria-label="${label}"`);
    expect(html).not.toContain(`aria-label="${text}"`);
  });

  it.each(["👁", "👁️"])(
    "renders %s as one fixed, centred synthetic eye",
    (eye) => {
      const html = renderToString(
        <LivingText
          text={`^${eye}`}
          eyeMarkers
          eyeShape="star"
          eyeStyle="cosmic"
          gaze="scan"
        />,
      );
      expect(html.match(/data-eye-emoji="true"/g) ?? []).toHaveLength(1);
      expect(html).not.toContain("data-rest-gaze");
      expect(html).toContain(`aria-label="${eye}"`);
    },
  );

  it("renders marker eyes as fixed-center synthetic eyes", () => {
    const html = renderToString(
      <LivingText text="<A^B>C" eyeMarkers gaze="centered" />,
    );
    expect(html.match(/data-fixed-center="true"/g) ?? []).toHaveLength(3);
    expect(html).not.toContain("data-rest-gaze=");
  });

  it.each(gazeBehaviors)(
    "keeps marker and emoji precedence under %s gaze",
    (gaze) => {
      const html = renderToString(
        <LivingText text="<A^B>👁️" eyeMarkers gaze={gaze} />,
      );
      expect(html.match(/data-fixed-center="true"/g) ?? []).toHaveLength(3);
      expect(html.match(/data-eye-emoji="true"/g) ?? []).toHaveLength(1);
      expect(html).not.toContain("data-rest-gaze=");
      if (gaze === "follow") expect(html).not.toContain("data-gaze");
      else expect(html).toContain(`data-gaze="${gaze}"`);
    },
  );

  it.each(eyeShapes)("renders the %s eye shape", (eyeShape) => {
    const html = renderToString(
      <LivingText text="^A" eyeMarkers eyeShape={eyeShape} />,
    );
    if (eyeShape === "round") expect(html).not.toContain("data-eye-shape");
    else expect(html).toContain(`data-eye-shape="${eyeShape}"`);
  });

  it.each(eyeStyles)("renders the %s eye art style", (eyeStyle) => {
    const html = renderToString(
      <LivingText text="^A" eyeMarkers eyeStyle={eyeStyle} />,
    );
    if (eyeStyle === "classic") expect(html).not.toContain("data-eye-style");
    else expect(html).toContain(`data-eye-style="${eyeStyle}"`);
  });

  it.each(gazeBehaviors)("renders the %s gaze behaviour", (gaze) => {
    const html = renderToString(
      <LivingText text="^A" eyeMarkers gaze={gaze} />,
    );
    if (gaze === "follow") expect(html).not.toContain("data-gaze");
    else expect(html).toContain(`data-gaze="${gaze}"`);
  });

  it("exports every blink behaviour", () => {
    expect(blinkBehaviors).toEqual(["natural", "wink", "none"]);
  });

  it.each(expressionLevels)("renders the %s expression level", (expression) => {
    const html = renderToString(
      <LivingText text="^A" eyeMarkers expression={expression} />,
    );
    if (expression === "playful") expect(html).not.toContain("data-expression");
    else expect(html).toContain(`data-expression="${expression}"`);
  });

  it.each(mouthStyles)("renders the %s mouth", (mouth) => {
    const html = renderToString(<LivingText text="O" mouth={mouth} />);
    if (mouth === "none") expect(html).not.toContain("data-mouth");
    else expect(html).toContain(`data-mouth="${mouth}"`);
  });

  it.each(thoughtBubbleStyles)(
    "renders the %s thought bubble",
    (bubbleStyle) => {
      expect(
        renderToString(
          <LivingText
            text="^A"
            eyeMarkers
            mood={livingTextMoods.excited}
            bubbleStyle={bubbleStyle}
          />,
        ),
      ).toContain(`data-bubble-style="${bubbleStyle}"`);
    },
  );

  it.each([
    [livingTextMoods.idleCurious, "round", "classic"],
    [livingTextMoods.excited, "diamond", "gloss"],
    [livingTextMoods.sadShrivel, "droplet", "outline"],
  ] as const)("composes %s with %s/%s eyes", (mood, eyeShape, eyeStyle) => {
    const html = renderToString(
      <LivingText
        text="^A>B"
        eyeMarkers
        mood={mood}
        eyeShape={eyeShape}
        eyeStyle={eyeStyle}
        reducedMotion
      />,
    );
    expect(html).toContain(`data-mood="${mood}"`);
    expect(html).toContain('data-fixed-center="true"');
    expect(html).not.toContain("data-rest-gaze=");
    if (eyeShape !== "round")
      expect(html).toContain(`data-eye-shape="${eyeShape}"`);
    if (eyeStyle !== "classic")
      expect(html).toContain(`data-eye-style="${eyeStyle}"`);
  });

  it.each(Object.entries(livingTextThemes))(
    "renders the %s atmosphere palette",
    (theme, palette) => {
      const html = renderToString(
        <LivingText
          text="^A"
          eyeMarkers
          theme={theme as keyof typeof livingTextThemes}
        />,
      );
      if (theme === "classic") {
        expect(html).not.toContain("data-theme");
      } else {
        expect(html).toContain(`data-theme="${theme}"`);
        expect(html).toContain(palette.idle);
        expect(html).toContain(palette.eye);
      }
    },
  );

  it.each([
    [livingTextMoods.idleCurious, "", 0],
    [livingTextMoods.nearStartled, "AWWWW", 0],
    [livingTextMoods.excited, "AWWWW", 0],
    [livingTextMoods.blush, "AWWWW", 2],
    [livingTextMoods.celebration, "yay", 0],
    [livingTextMoods.sadShrivel, "ow.", 0],
    [livingTextMoods.recovery, "aw.", 0],
  ])("renders the %s mood distinctly", (mood, thought, cheekCount) => {
    const html = renderToString(<LivingText text="ABCD" mood={mood} />);
    expect(html).toContain(`data-mood="${mood}"`);
    expect(html.match(/eyslie__cheek/g) ?? []).toHaveLength(cheekCount);
    if (thought) expect(html).toContain(thought);
  });

  it.each([
    [true, livingTextMoods.idleCurious, 2],
    [false, livingTextMoods.blush, 0],
    ["auto", livingTextMoods.blush, 2],
    ["auto", livingTextMoods.excited, 0],
  ] as const)("honours blush %s in %s", (blush, mood, cheekCount) => {
    const html = renderToString(
      <LivingText text="A B C D" blush={blush} mood={mood} />,
    );
    expect(html.match(/eyslie__cheek/g) ?? []).toHaveLength(cheekCount);
    if (cheekCount) expect(html).toContain('data-blush="true"');
    else expect(html).not.toContain("data-blush");
  });

  it.each([
    [{}, undefined, false],
    [{ smile: false }, undefined, false],
    [{ smile: true }, "auto", true],
    [{ smile: true, mouth: "none" }, undefined, true],
    [{ smile: true, mouth: "frown" }, "frown", true],
    [{ mouth: "open" }, "open", false],
  ] as Array<
    [Pick<LivingTextProps, "mouth" | "smile">, string | undefined, boolean]
  >)("resolves mouth compatibility for %j", (props, mouth, legacySmile) => {
    const html = renderToString(<LivingText text="O" {...props} />);
    if (mouth) expect(html).toContain(`data-mouth="${mouth}"`);
    else expect(html).not.toContain("data-mouth");
    expect(html.includes('data-smile="true"')).toBe(legacySmile);
  });

  it("falls back from an invalid runtime theme and honours color overrides", () => {
    expect(() =>
      renderToString(
        <LivingText
          text="O"
          theme={"missing" as keyof typeof livingTextThemes}
        />,
      ),
    ).not.toThrow();
    const html = renderToString(
      <LivingText
        text="O"
        idleColor="#111111"
        excitedColor="#222222"
        sadColor="#333333"
        eyeColor="#444444"
        pupilColor="#555555"
      />,
    );
    for (const color of ["#111111", "#222222", "#333333", "#444444", "#555555"])
      expect(html).toContain(color);
  });

  it("alternates a legacy side glance", () => {
    const html = renderToString(
      <LivingText text="OU" gaze="sideGlance" blink="none" />,
    );
    expect(html).toContain('data-rest-gaze="left"');
    expect(html).toContain('data-rest-gaze="right"');
  });

  it("cycles a deliberate wink across resolved eyes", () => {
    vi.useFakeTimers();
    const previousWindow = globalThis.window;
    globalThis.window = { setTimeout, clearTimeout } as unknown as Window &
      typeof globalThis;
    let renderer: ReturnType<typeof create> | undefined;
    act(() => {
      renderer = create(
        <LivingText text="OU" gaze="centered" blink="wink" seed={12} />,
      );
    });
    act(() => {
      vi.advanceTimersByTime(getOrganicWinkDelayMs(12, 0));
    });
    expect(
      renderer?.root.findAll((node) => node.props["data-winking"] === "true"),
    ).toHaveLength(1);
    act(() => renderer?.unmount());
    globalThis.window = previousWindow;
    vi.useRealTimers();
  });

  it("renders custom props in SSR", () => {
    const html = renderToString(
      <LivingText
        text="O e\u0301 🇦🇺 U"
        ariaLabel="Unicode eyes"
        className="demo"
        mood={livingTextMoods.blush}
        thoughts={{ blush: "hello" }}
        style={{ color: "rebeccapurple" }}
        reducedMotion
      />,
    );

    expect(html).toContain('aria-label="Unicode eyes"');
    expect(html).toContain("eyslie__cheek");
    expect(html).toContain("hello");
    expect(html).toContain("demo");
    expect(html).toContain("rebeccapurple");
  });

  it.each([
    [{ text: "" }, undefined],
    [{ text: " \n\t" }, undefined],
    [{ text: "JOIN US" }, "JOIN US"],
    [{ text: "JOIN US", ariaLabel: "  " }, "JOIN US"],
    [{ text: "", ariaLabel: "Living letters" }, "Living letters"],
    [{ text: "W^O>W!", eyeMarkers: true }, "WOW!"],
    [{ text: "^A", eyeMarkers: true, ariaLabel: "Custom eye" }, "Custom eye"],
  ] as Array<[LivingTextProps, string | undefined]>)(
    "uses accessible semantics for $0",
    (props, label) => {
      const html = renderToString(<LivingText {...props} />);
      if (label) {
        expect(html).toContain('role="img"');
        expect(html).toContain(`aria-label="${label}"`);
        expect(html).not.toMatch(/^<span class="eyslie" aria-hidden="true"/);
      } else {
        expect(html).not.toContain('role="img"');
        expect(html).not.toContain("aria-label=");
        expect(html).toMatch(/^<span class="eyslie" aria-hidden="true"/);
      }
    },
  );
});

describe("browser hooks", () => {
  it.each([0, 1])(
    "coalesces pointer bursts for animation frame ID %i",
    (frameId) => {
      const previousWindow = globalThis.window;
      const listeners = new Map<string, (event: PointerEvent) => void>();
      const registrations = new Map<
        string,
        boolean | AddEventListenerOptions | undefined
      >();
      const frames: FrameRequestCallback[] = [];
      const cancelAnimationFrame = vi.fn();
      globalThis.window = {
        addEventListener: (
          type: string,
          listener: EventListener,
          options?: boolean | AddEventListenerOptions,
        ) => {
          listeners.set(type, listener as (event: PointerEvent) => void);
          registrations.set(type, options);
        },
        removeEventListener: (type: string) => listeners.delete(type),
        requestAnimationFrame: (callback: FrameRequestCallback) => {
          frames.push(callback);
          return frameId;
        },
        cancelAnimationFrame,
      } as unknown as Window & typeof globalThis;

      const makeEye = (
        left: number,
        hasInnerEye: boolean,
        eyeEmoji = false,
        fixedCenter = false,
      ) => {
        const innerEye = hasInnerEye
          ? {
              getBoundingClientRect: vi.fn(() => ({
                left,
                top: 0,
                width: 12,
                height: 8,
              })),
            }
          : null;
        return {
          innerEye,
          getAttribute: (name: string) =>
            name === "data-eye-emoji" && eyeEmoji
              ? "true"
              : name === "data-fixed-center" && fixedCenter
                ? "true"
                : null,
          style: { setProperty: vi.fn() },
          querySelector: () => innerEye,
          getBoundingClientRect: vi.fn(() => ({
            left,
            top: 0,
            width: 20,
            height: 16,
          })),
        };
      };
      const eyes = [
        makeEye(0, true),
        makeEye(30, false),
        makeEye(60, true, true),
        makeEye(90, false, false, true),
      ];
      const trackedEyes = eyes.slice(0, 2);
      const root = {
        style: { setProperty: vi.fn() },
        querySelectorAll: () => eyes,
      } as unknown as HTMLElement;
      const ref = { current: root };

      function Host({
        disabled = false,
        strength,
      }: {
        disabled?: boolean;
        strength?: number;
      }) {
        useEyeTracking(ref, { disabled, strength });
        return null;
      }

      let renderer: ReturnType<typeof create> | undefined;
      act(() => {
        renderer = create(<Host />);
      });
      listeners.get("pointermove")?.({
        clientX: 50,
        clientY: 8,
      } as PointerEvent);
      listeners.get("pointermove")?.({
        clientX: 40,
        clientY: 8,
      } as PointerEvent);
      expect(frames).toHaveLength(1);
      frames.shift()?.(0);
      for (const eye of trackedEyes) {
        expect(
          eye.innerEye?.getBoundingClientRect ?? eye.getBoundingClientRect,
        ).toHaveBeenCalledTimes(1);
        expect(eye.style.setProperty).toHaveBeenCalledWith(
          "--eyslie-pupil-x",
          expect.stringContaining("px"),
        );
      }
      expect(eyes[2]?.style.setProperty).not.toHaveBeenCalled();
      expect(eyes[3]?.style.setProperty).not.toHaveBeenCalled();
      const fullStrengthX = Number.parseFloat(
        eyes[0]?.style.setProperty.mock.calls
          .filter(([property]) => property === "--eyslie-pupil-x")
          .at(-1)?.[1] ?? "0",
      );
      listeners.get("pointermove")?.({
        clientX: 10,
        clientY: 8,
      } as PointerEvent);
      listeners.get("pointerout")?.({
        relatedTarget: {} as EventTarget,
      } as PointerEvent);
      expect(cancelAnimationFrame).not.toHaveBeenCalled();
      listeners.get("pointerout")?.({ relatedTarget: null } as PointerEvent);
      for (const eye of trackedEyes) {
        expect(eye.style.setProperty).toHaveBeenCalledWith(
          "--eyslie-pupil-x",
          "0px",
        );
        expect(eye.style.setProperty).toHaveBeenCalledWith(
          "--eyslie-pupil-y",
          "0px",
        );
      }
      expect(eyes[2]?.style.setProperty).not.toHaveBeenCalled();
      expect(eyes[3]?.style.setProperty).not.toHaveBeenCalled();
      expect(registrations.get("scroll")).toBe(true);
      const writes = eyes.map((eye) => eye.style.setProperty.mock.calls.length);
      for (const event of ["blur", "resize", "scroll"]) {
        listeners.get(event)?.({} as PointerEvent);
      }
      expect(
        eyes.map((eye) => eye.style.setProperty.mock.calls.length),
      ).toEqual(writes);
      act(() => renderer?.unmount());
      expect(cancelAnimationFrame).toHaveBeenCalledWith(frameId);
      expect(listeners.size).toBe(0);

      frames.length = 0;
      act(() => {
        renderer = create(<Host strength={0.5} />);
      });
      listeners.get("pointermove")?.({
        clientX: 40,
        clientY: 8,
      } as PointerEvent);
      frames.shift()?.(0);
      const halfStrengthX = Number.parseFloat(
        eyes[0]?.style.setProperty.mock.calls
          .filter(([property]) => property === "--eyslie-pupil-x")
          .at(-1)?.[1] ?? "0",
      );
      expect(halfStrengthX).toBeCloseTo(fullStrengthX * 0.5);
      act(() => renderer?.unmount());

      act(() => {
        renderer = create(<Host />);
      });
      act(() => renderer?.unmount());
      expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);

      const rootOnly = {
        style: { setProperty: vi.fn() },
        querySelectorAll: () => [],
      } as unknown as HTMLElement;
      function RootOnlyHost() {
        useEyeTracking({ current: rootOnly }, { disabled: true });
        return null;
      }
      function NullHost() {
        useEyeTracking({ current: null }, { disabled: true });
        return null;
      }
      act(() => {
        create(<Host disabled />);
        create(<RootOnlyHost />);
        create(<NullHost />);
      });
      expect(rootOnly.style.setProperty).toHaveBeenCalledWith(
        "--eyslie-pupil-x",
        "0px",
      );
      globalThis.window = previousWindow;
    },
  );

  it("tracks proximity transitions and resets when disabled", () => {
    const previousWindow = globalThis.window;
    const listeners = new Map<string, (event: PointerEvent) => void>();
    const registrations = new Map<
      string,
      boolean | AddEventListenerOptions | undefined
    >();
    globalThis.window = {
      addEventListener: (
        type: string,
        listener: EventListener,
        options?: boolean | AddEventListenerOptions,
      ) => {
        listeners.set(type, listener as (event: PointerEvent) => void);
        registrations.set(type, options);
      },
      removeEventListener: (type: string) => listeners.delete(type),
    } as unknown as Window & typeof globalThis;
    const ref: { current: HTMLElement | null } = {
      current: {
        getBoundingClientRect: () => ({
          left: 10,
          top: 10,
          right: 50,
          bottom: 40,
        }),
      } as HTMLElement,
    };
    const observed: boolean[] = [];

    function Host({ disabled = false }: { disabled?: boolean }) {
      observed.push(useProximity(ref, { radius: 8, disabled }));
      return null;
    }
    function DefaultHost() {
      observed.push(useProximity(ref));
      return null;
    }

    let renderer: ReturnType<typeof create> | undefined;
    act(() => {
      renderer = create(<Host />);
    });
    const moveNear = () => {
      act(() =>
        listeners.get("pointermove")?.({
          clientX: 12,
          clientY: 12,
        } as PointerEvent),
      );
      expect(observed.at(-1)).toBe(true);
    };
    moveNear();
    act(() =>
      listeners.get("pointerout")?.({
        relatedTarget: {} as EventTarget,
      } as PointerEvent),
    );
    expect(observed.at(-1)).toBe(true);
    act(() =>
      listeners.get("pointerout")?.({ relatedTarget: null } as PointerEvent),
    );
    expect(observed.at(-1)).toBe(false);
    expect(registrations.get("scroll")).toBe(true);
    for (const event of ["blur", "resize", "scroll"]) {
      moveNear();
      act(() => listeners.get(event)?.({} as PointerEvent));
      expect(observed.at(-1)).toBe(false);
    }
    act(() => listeners.get("blur")?.({} as PointerEvent));
    act(() =>
      listeners.get("pointermove")?.({
        clientX: 12,
        clientY: 12,
      } as PointerEvent),
    );
    act(() =>
      listeners.get("pointermove")?.({
        clientX: 13,
        clientY: 13,
      } as PointerEvent),
    );
    expect(observed.at(-1)).toBe(true);
    act(() => renderer?.update(<Host disabled />));
    expect(observed.at(-1)).toBe(false);
    act(() => renderer?.update(<Host />));
    act(() => {
      ref.current = null;
      listeners.get("pointermove")?.({
        clientX: 12,
        clientY: 12,
      } as PointerEvent);
    });
    expect(observed.at(-1)).toBe(false);
    act(() => renderer?.unmount());
    expect(listeners.size).toBe(0);

    globalThis.window = previousWindow;
    act(() => {
      renderer = create(<Host />);
      create(<DefaultHost />);
    });
    act(() => renderer?.unmount());
  });
});

describe("motion styles", () => {
  const css = readFileSync("src/styles/eyslie.css", "utf8");
  const demoCss = readFileSync("examples/demo/src/styles.css", "utf8");
  const demoSource = readFileSync("examples/demo/src/main.tsx", "utf8");
  const noPreference = css.slice(
    css.indexOf("@media (prefers-reduced-motion: no-preference)"),
    css.indexOf("@media (prefers-reduced-motion: reduce)"),
  );
  const reduced = css.slice(
    css.indexOf("@media (prefers-reduced-motion: reduce)"),
  );
  const demoNoPreference = demoCss.slice(
    demoCss.indexOf("@media (prefers-reduced-motion: no-preference)"),
    demoCss.indexOf("@media (prefers-reduced-motion: reduce)"),
  );
  const demoReduced = demoCss.slice(
    demoCss.indexOf("@media (prefers-reduced-motion: reduce)"),
  );

  it("only renders winks when motion is allowed", () => {
    expect(noPreference).toContain('data-winking="true"');
    expect(noPreference).toContain("height: 0.06em");
    expect(noPreference).toContain("opacity: 0");
    expect(reduced).not.toContain("data-winking");
  });

  it.each([
    "nearStartled",
    "excited",
    "blush",
    "celebration",
    "sadShrivel",
    "recovery",
  ])("gives %s a distinct pose", (mood) => {
    expect(css).toContain(`data-mood="${mood}"`);
    expect(noPreference).toContain(`data-mood="${mood}"`);
  });

  it.each(eyeShapes.filter((shape) => shape !== "round"))(
    "styles the %s eye shape",
    (shape) => {
      expect(css).toContain(`data-eye-shape="${shape}"`);
    },
  );

  it.each(eyeStyles.filter((style) => style !== "classic"))(
    "styles the %s eye art",
    (style) => {
      expect(css).toContain(`data-eye-style="${style}"`);
    },
  );

  it("anchors cheeks and renders distinct bubbles and mouths", () => {
    expect(css).toContain(".eyslie__letter > .eyslie__cheek");
    expect(css).not.toContain("color-mix(");
    expect(css).toContain("var(--eyslie-blush-color)");
    expect(css).toContain("transparent 72%");
    expect(css).toContain("var(--eyslie-bubble-color)");
    expect(css).toContain("bottom: calc(100% + 0.35em)");
    expect(css).toContain("max-inline-size: min(24rem, 85vw)");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).toContain("text-align: start");
    expect(css).toContain('data-mouth="auto"');
    expect(css).toContain('data-mouth="grin"');
    expect(css).toContain('data-mouth="open"');
    expect(css).toContain('data-mouth="flat"');
    expect(css).toContain('data-mouth="frown"');
    expect(css).toContain('data-mouth="pout"');
    expect(css).toContain('data-blush="true"');
    expect(css).toContain("--eyslie-bubble-rotate");
    for (const bubble of thoughtBubbleStyles.filter(
      (style) => style !== "cloud",
    )) {
      expect(css).toContain(`data-bubble-style="${bubble}"`);
    }
  });

  it("composes mood dimensions with shape and art variables", () => {
    expect(css).toContain("width: var(--eyslie-eye-width)");
    expect(css).toContain("height: var(--eyslie-eye-height)");
    expect(css).toContain("scale(var(--eyslie-eye-scale)");
    expect(css).toContain("--eyslie-eye-scale-y: 0.72");
    expect(css).toContain("--eyslie-eye-rotation: -4deg");
    expect(css).not.toMatch(
      /data-eye-style="(?:pixel|paper|outline|gloss)"[^{}]*\.eyslie__inner-eye\s*{[^}]*border-radius/s,
    );
  });

  it("normalizes eye emoji without tracking or a second visible glyph", () => {
    expect(css).toContain('data-eye-emoji="true"');
    expect(css).toContain("visibility: hidden");
    expect(renderToString(<LetterEye letter="👁️" />)).toContain(
      "--eyslie-pupil-x:0px",
    );
    expect(noPreference).toContain(':not([data-eye-emoji="true"])');
  });

  it("outlines every demo specimen against its changing surface", () => {
    expect(demoCss).toContain("-webkit-text-stroke");
    expect(demoCss).toContain("paint-order: stroke fill");
    expect(demoCss).toContain("-1px -1px 0 var(--ink)");
  });

  it("gates every animation behind explicit and system motion preferences", () => {
    expect(noPreference).toContain('data-reduced-motion="false"');
    expect(noPreference).toContain("eyslie-wander");
    expect(noPreference).toContain("eyslie-scan");
    expect(reduced).toContain("--eyslie-rest-x");
    expect(demoNoPreference).toContain(
      '.living-stage[data-reduced-motion="false"] .live-dot',
    );
    expect(demoNoPreference).toContain("demo-running-ellipsis");
    expect(demoReduced).not.toContain("demo-running-dot");
    expect(demoReduced).not.toContain("demo-running-ellipsis");
  });

  it("uses native range, radio, select, text and checkbox controls", () => {
    for (const type of ['type="range"', 'type="radio"', 'type="checkbox"']) {
      expect(demoSource).toContain(type);
    }
    expect(demoSource).toContain("<select");
    expect(demoSource).toContain("aria-valuetext");
    expect(demoSource).toContain('<output htmlFor="expression-intensity">');
    expect(demoSource).toContain('aria-atomic="true"');
  });
});
