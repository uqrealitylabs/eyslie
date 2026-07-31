import { renderToString } from "react-dom/server";
import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  Blush,
  constrainPupilOffset,
  createWinkSchedule,
  getOrganicWinkDelayMs,
  getPupilOffsetFromRect,
  getThoughtForMood,
  isPointerNear,
  LetterEye,
  LIVING_TEXT_BLUSH_DELAY_MS,
  LivingText,
  type LivingTextEvent,
  type LivingTextMood,
  livingTextMoods,
  nextLivingTextMood,
  shouldShowBlush,
  splitTextLetters,
  ThoughtBubble,
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
    ["", []],
    ["JOIN US", ["J", "O", "I", "N", " ", "U", "S"]],
    ["O🙂", ["O", "🙂"]],
    ["e\u0301", ["e\u0301"]],
    ["🇦🇺", ["🇦🇺"]],
    ["👍🏽", ["👍🏽"]],
    ["👨‍👩‍👧‍👦", ["👨‍👩‍👧‍👦"]],
  ])("segments graphemes in %s", (text, expected) => {
    expect(splitTextLetters(text)).toEqual(expected);
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
    expect(ThoughtBubble({ children: "" })).toBeNull();
    expect(ThoughtBubble({ children: "yay" })).toMatchObject({
      props: { className: "eyslie__thought", "aria-hidden": "true" },
    });
    expect(LetterEye({ letter: "O" }).props.style).toBeUndefined();
    expect(
      LetterEye({
        letter: "U",
        eyeRole: "secondary",
        pupilOffset: { x: 1, y: 2 },
        winking: true,
      }),
    ).toMatchObject({
      props: {
        "data-eye-role": "secondary",
        "data-winking": "true",
        style: { "--eyslie-pupil-x": "1px", "--eyslie-pupil-y": "2px" },
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
    [{ text: "" }, 0],
  ])("renders valid eye anchors for $0", (props, eyeCount) => {
    const html = renderToString(<LivingText {...props} />);
    expect(html.match(/data-eye-role/g) ?? []).toHaveLength(eyeCount);
  });

  it("keeps SSR and the first browser render identical", () => {
    const props = {
      text: "O e\u0301 🇦🇺 U",
      ariaLabel: "Unicode eyes",
      className: "demo",
      mood: livingTextMoods.blush,
      thoughts: { blush: "hello" },
      style: { color: "rebeccapurple" },
      reducedMotion: true,
    } as const;
    const server = renderToString(<LivingText {...props} />);
    const previousWindow = globalThis.window;
    globalThis.window = {} as Window & typeof globalThis;
    const browser = renderToString(<LivingText {...props} />);
    globalThis.window = previousWindow;

    expect(browser).toBe(server);
    expect(server).toContain('aria-label="Unicode eyes"');
    expect(server).toContain("eyslie__blush");
    expect(server).toContain("hello");
    expect(server).toContain("demo");
    expect(server).toContain("rebeccapurple");
  });
});

describe("browser hooks", () => {
  it("coalesces pointer bursts and measures each eye", () => {
    const previousWindow = globalThis.window;
    const listeners = new Map<string, (event: PointerEvent) => void>();
    const frames: FrameRequestCallback[] = [];
    const cancelAnimationFrame = vi.fn();
    globalThis.window = {
      addEventListener: (type: string, listener: EventListener) =>
        listeners.set(type, listener as (event: PointerEvent) => void),
      removeEventListener: (type: string) => listeners.delete(type),
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        frames.push(callback);
        return frames.length;
      },
      cancelAnimationFrame,
    } as unknown as Window & typeof globalThis;

    const makeEye = (left: number) => ({
      style: { setProperty: vi.fn() },
      getBoundingClientRect: vi.fn(() => ({
        left,
        top: 0,
        width: 20,
        height: 16,
      })),
    });
    const eyes = [makeEye(0), makeEye(30)];
    const root = {
      style: { setProperty: vi.fn() },
      querySelectorAll: () => eyes,
    } as unknown as HTMLElement;
    const ref = { current: root };

    function Host({ disabled = false }: { disabled?: boolean }) {
      useEyeTracking(ref, { disabled });
      return null;
    }

    let renderer: ReturnType<typeof create> | undefined;
    act(() => {
      renderer = create(<Host />);
    });
    listeners.get("pointermove")?.({ clientX: 50, clientY: 8 } as PointerEvent);
    listeners.get("pointermove")?.({ clientX: 40, clientY: 8 } as PointerEvent);
    expect(frames).toHaveLength(1);
    frames.shift()?.(0);
    for (const eye of eyes) {
      expect(eye.getBoundingClientRect).toHaveBeenCalledTimes(1);
      expect(eye.style.setProperty).toHaveBeenCalledWith(
        "--eyslie-pupil-x",
        expect.stringContaining("px"),
      );
    }
    listeners.get("pointermove")?.({ clientX: 10, clientY: 8 } as PointerEvent);
    act(() => renderer?.unmount());
    expect(cancelAnimationFrame).toHaveBeenCalled();
    expect(listeners.has("pointermove")).toBe(false);

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
  });

  it("tracks proximity transitions and resets when disabled", () => {
    const previousWindow = globalThis.window;
    const listeners = new Map<string, (event: PointerEvent) => void>();
    globalThis.window = {
      addEventListener: (type: string, listener: EventListener) =>
        listeners.set(type, listener as (event: PointerEvent) => void),
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
    expect(listeners.has("pointermove")).toBe(false);

    globalThis.window = previousWindow;
    act(() => {
      renderer = create(<Host />);
      create(<DefaultHost />);
    });
    act(() => renderer?.unmount());
  });
});
