import { act, create } from "react-test-renderer";
import { describe, expect, it, vi } from "vitest";
import {
  Blush,
  constrainPupilOffset,
  createWinkSchedule,
  getEyeLetterParts,
  getOrganicWinkDelayMs,
  getThoughtForMood,
  isPointerNear,
  LetterEye,
  LIVING_TEXT_BLUSH_DELAY_MS,
  LivingText,
  livingTextEmotionNames,
  livingTextEmotionPresets,
  livingTextEyeStyles,
  livingTextMoods,
  nextLivingTextMood,
  resolveLivingTextEmotion,
  shouldAnimateLivingText,
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

describe("living text state", () => {
  it("keeps reusable mood transitions explicit", () => {
    expect(nextLivingTextMood(livingTextMoods.idleCurious, "pointerNear")).toBe(
      livingTextMoods.nearStartled,
    );
    expect(
      nextLivingTextMood(livingTextMoods.nearStartled, "pointerAway"),
    ).toBe(livingTextMoods.idleCurious);
    expect(nextLivingTextMood(livingTextMoods.idleCurious, "excite")).toBe(
      livingTextMoods.excited,
    );
    expect(
      nextLivingTextMood(
        livingTextMoods.excited,
        "blushElapsed",
        LIVING_TEXT_BLUSH_DELAY_MS,
      ),
    ).toBe(livingTextMoods.blush);
    expect(nextLivingTextMood(livingTextMoods.blush, "celebrate")).toBe(
      livingTextMoods.celebration,
    );
    expect(nextLivingTextMood(livingTextMoods.excited, "sadden")).toBe(
      livingTextMoods.sadShrivel,
    );
    expect(nextLivingTextMood(livingTextMoods.sadShrivel, "recover")).toBe(
      livingTextMoods.idleCurious,
    );
    expect(
      nextLivingTextMood(
        livingTextMoods.excited,
        "blushElapsed",
        LIVING_TEXT_BLUSH_DELAY_MS - 1,
      ),
    ).toBe(livingTextMoods.excited);
    expect(nextLivingTextMood(livingTextMoods.blush, "pointerNear")).toBe(
      livingTextMoods.blush,
    );
  });

  it("keeps blush timing generic", () => {
    expect(shouldShowBlush(LIVING_TEXT_BLUSH_DELAY_MS - 1)).toBe(false);
    expect(shouldShowBlush(LIVING_TEXT_BLUSH_DELAY_MS)).toBe(true);
  });
});

describe("eye behaviour", () => {
  it("keeps the O glyph while adding a white inner eye and brown pupil layer", () => {
    expect(getEyeLetterParts("O")).toEqual({
      glyph: "O",
      hasInnerEye: true,
      hasPupil: true,
      keepsGlyphShape: true,
    });

    expect(LetterEye({ letter: "O" })).toMatchObject({
      props: {
        className: "eyslie__letter eyslie__letter--eye",
        "data-eye-role": "primary",
      },
    });
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
      },
    });
  });

  it("keeps the pupil constrained inside the eye", () => {
    const offset = constrainPupilOffset(100, -80, { width: 20, height: 16 });

    expect(Math.abs(offset.x)).toBeLessThanOrEqual(5.6);
    expect(Math.abs(offset.y)).toBeLessThanOrEqual(3.84);
    expect(constrainPupilOffset(0, 0, { width: 20, height: 16 })).toEqual({
      x: 0,
      y: 0,
    });
  });

  it("creates deterministic but non-constant wink delays", () => {
    const first = getOrganicWinkDelayMs(12, 0);
    const again = getOrganicWinkDelayMs(12, 0);
    const next = getOrganicWinkDelayMs(12, 1);
    const schedule = createWinkSchedule(12);

    expect(first).toBe(again);
    expect(first).not.toBe(next);
    expect(schedule(0)).toBe(first);
    expect(schedule(1)).toBe(next);
    expect(first).toBeGreaterThanOrEqual(2600);
    expect(first).toBeLessThanOrEqual(6200);
  });

  it("keeps random winks brief instead of closing for a whole interval", () => {
    vi.useFakeTimers();
    const previousWindow = globalThis.window;
    globalThis.window = {
      setTimeout,
      clearTimeout,
    } as unknown as Window & typeof globalThis;

    function WinkProbe() {
      const wink = useRandomWink({ seed: 12 });
      return <span data-winking={wink.isWinking ? "true" : "false"} />;
    }

    let renderer: ReturnType<typeof create> | undefined;
    act(() => {
      renderer = create(<WinkProbe />);
    });
    expect(JSON.stringify(renderer?.toJSON())).toContain(
      '"data-winking":"false"',
    );

    act(() => {
      vi.advanceTimersByTime(getOrganicWinkDelayMs(12, 0));
    });
    expect(JSON.stringify(renderer?.toJSON())).toContain(
      '"data-winking":"true"',
    );

    act(() => {
      vi.advanceTimersByTime(160);
    });
    expect(JSON.stringify(renderer?.toJSON())).toContain(
      '"data-winking":"false"',
    );

    act(() => {
      renderer?.unmount();
    });
    globalThis.window = previousWindow;
    vi.useRealTimers();
  });
});

describe("proximity, thought bubbles, and accessibility helpers", () => {
  it("detects pointer proximity with a configurable radius", () => {
    const rect = { left: 10, top: 10, right: 50, bottom: 40 };

    expect(isPointerNear(rect, { x: 4, y: 12 }, 8)).toBe(true);
    expect(isPointerNear(rect, { x: 0, y: 0 }, 4)).toBe(false);
  });

  it("uses configurable thought bubbles for external mood control", () => {
    expect(
      getThoughtForMood(livingTextMoods.celebration, {
        [livingTextMoods.celebration]: "yay",
      }),
    ).toBe("yay");
    expect(getThoughtForMood(livingTextMoods.idleCurious, {})).toBe("");
  });

  it("splits text safely", () => {
    expect(splitTextLetters("O🙂")).toEqual(["O", "🙂"]);
  });

  it("disables animation in reduced-motion or deterministic test mode", () => {
    expect(shouldAnimateLivingText({ reducedMotion: true })).toBe(false);
    expect(shouldAnimateLivingText({ testMode: true })).toBe(false);
    expect(shouldAnimateLivingText({})).toBe(true);
  });

  it("resolves comprehensive emotion and style contracts", () => {
    expect(livingTextEmotionNames).toContain("empathic-pain");
    expect(livingTextEmotionNames).toContain("craving");
    expect(livingTextEyeStyles).toEqual([
      "cartoon",
      "hand-drawn",
      "ink",
      "anime",
      "googly",
      "minimal",
      "soft-pastel",
      "geometric",
    ]);
    for (const name of livingTextEmotionNames) {
      const preset = livingTextEmotionPresets[name];
      const resolved = resolveLivingTextEmotion(name, 0.8);

      expect(preset.valence).toBeGreaterThanOrEqual(-1);
      expect(preset.valence).toBeLessThanOrEqual(1);
      expect(resolved.eyeOpenness).toBeGreaterThanOrEqual(0);
      expect(resolved.eyeOpenness).toBeLessThanOrEqual(1);
      expect(resolved.tearAmount).toBeGreaterThanOrEqual(0);
      expect(resolved.blushAmount).toBeGreaterThanOrEqual(0);
    }

    expect(
      resolveLivingTextEmotion({
        valence: 2,
        arousal: 2,
        dominance: -2,
        intensity: 2,
      }),
    ).toMatchObject({
      valence: 1,
      arousal: 1,
      dominance: -1,
      intensity: 1,
    });
  });
});

describe("rendered pieces", () => {
  it("renders blush and thought nodes as decorative layers", () => {
    expect(Blush({ active: false })).toBeNull();
    expect(Blush({ active: true })).toMatchObject({
      props: { className: "eyslie__blush", "aria-hidden": "true" },
    });
    expect(ThoughtBubble({ children: "" })).toBeNull();
    expect(ThoughtBubble({ children: "yay" })).toMatchObject({
      props: { className: "eyslie__thought", "aria-hidden": "true" },
    });
  });

  it("renders living text with explicit eye anchors and accessible fallback text", () => {
    let renderer: ReturnType<typeof create> | undefined;

    act(() => {
      renderer = create(
        <LivingText
          text="JOIN US"
          ariaLabel="Join us"
          mood={livingTextMoods.blush}
          eyeLetters={{ primary: 1, secondary: 5 }}
          emotion="joy"
          eyeStyle="minimal"
          testMode
        />,
      );
    });
    const tree = renderer?.toJSON();

    expect(JSON.stringify(tree)).toContain('"aria-label":"Join us"');
    expect(JSON.stringify(tree)).toContain('"data-eye-role":"primary"');
    expect(JSON.stringify(tree)).toContain('"data-eye-role":"secondary"');
    expect(JSON.stringify(tree)).toContain('"data-eye-style":"minimal"');
    expect(JSON.stringify(tree)).toContain('"data-emotion":"joy"');
    expect(JSON.stringify(tree)).toContain("AWWWW");

    act(() => {
      renderer = create(<LivingText text="JOIN US" testMode />);
    });
    expect(JSON.stringify(renderer?.toJSON())).toContain(
      '"data-eye-role":"primary"',
    );

    act(() => {
      renderer = create(
        <LivingText
          text="JOIN US"
          eyeLetters={{}}
          reducedMotion
          className="demo"
        />,
      );
    });
    expect(JSON.stringify(renderer?.toJSON())).toContain(
      '"data-reduced-motion":"true"',
    );
  });

  it("renders plain text before readiness and calls external readiness", () => {
    const onReady = vi.fn();
    let renderer: ReturnType<typeof create> | undefined;

    act(() => {
      renderer = create(
        <LivingText
          text="JOIN US"
          ready={false}
          onReady={onReady}
          eyeLetters={{ primary: 1, secondary: 4 }}
        />,
      );
    });
    expect(JSON.stringify(renderer?.toJSON())).toContain(
      '"data-ready":"false"',
    );
    expect(JSON.stringify(renderer?.toJSON())).not.toContain("data-eye-role");

    act(() => {
      renderer = create(
        <LivingText
          text="JOIN US"
          ready
          onReady={onReady}
          eyeLetters={{ primary: 1, secondary: 4 }}
        />,
      );
    });
    expect(JSON.stringify(renderer?.toJSON())).toContain('"data-ready":"true"');
    expect(JSON.stringify(renderer?.toJSON())).toContain("data-eye-role");
    expect(onReady).toHaveBeenCalled();
  });

  it("waits for browser font and layout readiness before drawing eyes", async () => {
    const previousWindow = globalThis.window;
    const previousDocument = globalThis.document;
    const previousResizeObserver = globalThis.ResizeObserver;
    const frames: FrameRequestCallback[] = [];
    const disconnect = vi.fn();
    const observe = vi.fn();
    const onReady = vi.fn();
    class FakeResizeObserver {
      observe = observe;
      disconnect = disconnect;
    }
    globalThis.window = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      requestAnimationFrame: (callback: FrameRequestCallback) => {
        frames.push(callback);
        return frames.length;
      },
      cancelAnimationFrame: vi.fn(),
      setTimeout,
      clearTimeout,
    } as unknown as Window & typeof globalThis;
    globalThis.document = {
      fonts: { ready: Promise.resolve() },
    } as unknown as Document;
    globalThis.ResizeObserver =
      FakeResizeObserver as unknown as typeof ResizeObserver;

    let renderer: ReturnType<typeof create> | undefined;
    await act(async () => {
      renderer = create(<LivingText text="JOIN US" onReady={onReady} />, {
        createNodeMock: () => ({
          style: { setProperty: vi.fn() },
          getBoundingClientRect: () => ({
            left: 0,
            top: 0,
            width: 120,
            height: 30,
          }),
        }),
      });
      await Promise.resolve();
    });
    expect(JSON.stringify(renderer?.toJSON())).toContain(
      '"data-ready":"false"',
    );
    await act(async () => {
      frames.shift()?.(0);
      frames.shift()?.(16);
      await Promise.resolve();
    });

    expect(JSON.stringify(renderer?.toJSON())).toContain('"data-ready":"true"');
    expect(onReady).toHaveBeenCalled();
    expect(observe).toHaveBeenCalled();

    act(() => {
      renderer?.unmount();
    });
    expect(disconnect).toHaveBeenCalled();
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
    globalThis.ResizeObserver = previousResizeObserver;
  });

  it("keeps overlays disabled when the site is not ready", () => {
    const previousWindow = globalThis.window;
    const previousDocument = globalThis.document;
    const previousResizeObserver = globalThis.ResizeObserver;
    globalThis.window = {
      requestAnimationFrame: vi.fn(),
      cancelAnimationFrame: vi.fn(),
    } as unknown as Window & typeof globalThis;
    globalThis.document = {} as Document;
    globalThis.ResizeObserver = vi.fn() as unknown as typeof ResizeObserver;

    let renderer: ReturnType<typeof create> | undefined;
    act(() => {
      renderer = create(<LivingText text="JOIN US" siteReady={false} />);
    });

    expect(JSON.stringify(renderer?.toJSON())).toContain(
      '"data-ready":"false"',
    );
    expect(JSON.stringify(renderer?.toJSON())).not.toContain("data-eye-role");
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
    globalThis.ResizeObserver = previousResizeObserver;
  });

  it("handles fallback timers and failed readiness measurement", async () => {
    const previousWindow = globalThis.window;
    const previousDocument = globalThis.document;
    const previousResizeObserver = globalThis.ResizeObserver;
    const timers: TimerHandler[] = [];
    const clearTimeoutMock = vi.fn();
    globalThis.window = {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setTimeout: (callback: TimerHandler) => {
        timers.push(callback);
        return timers.length;
      },
      clearTimeout: clearTimeoutMock,
    } as unknown as Window & typeof globalThis;
    globalThis.document = {} as Document;
    globalThis.ResizeObserver = class {
      observe() {}
      disconnect() {}
    } as unknown as typeof ResizeObserver;

    let renderer: ReturnType<typeof create> | undefined;
    await act(async () => {
      renderer = create(<LivingText text="JOIN US" />, {
        createNodeMock: () => ({
          style: { setProperty: vi.fn() },
          getBoundingClientRect: () => ({ width: 0, height: 0 }),
        }),
      });
      await Promise.resolve();
    });
    await act(async () => {
      (timers.shift() as () => void)?.();
      (timers.shift() as () => void)?.();
      await Promise.resolve();
    });
    expect(JSON.stringify(renderer?.toJSON())).toContain(
      '"data-ready":"false"',
    );

    await act(async () => {
      renderer = create(<LivingText text="JOIN US" />, {
        createNodeMock: () => ({
          style: { setProperty: vi.fn() },
          getBoundingClientRect: () => ({ width: 120, height: 20 }),
        }),
      });
      await Promise.resolve();
    });
    act(() => {
      renderer?.unmount();
    });
    (timers.shift() as () => void)?.();
    (timers.shift() as () => void)?.();
    expect(clearTimeoutMock).toHaveBeenCalled();

    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
    globalThis.ResizeObserver = previousResizeObserver;
  });
});

describe("React hooks", () => {
  it("tracks eyes with CSS variables without React state", () => {
    const style = { setProperty: vi.fn() };
    const element = {
      style,
      getBoundingClientRect: () => ({
        left: 10,
        top: 10,
        width: 20,
        height: 16,
      }),
    } as unknown as HTMLElement;
    const ref = { current: element };
    const listeners = new Map<string, (event: PointerEvent) => void>();
    const previousWindow = globalThis.window;
    globalThis.window = {
      addEventListener: (type: string, listener: EventListener) => {
        listeners.set(type, listener as (event: PointerEvent) => void);
      },
      removeEventListener: (type: string) => {
        listeners.delete(type);
      },
    } as unknown as Window & typeof globalThis;

    function Host() {
      useEyeTracking(ref);
      return null;
    }
    function DisabledHost() {
      useEyeTracking(ref, { disabled: true });
      return null;
    }
    function NullHost() {
      useEyeTracking({ current: null });
      return null;
    }

    let hostRenderer: ReturnType<typeof create> | undefined;
    act(() => {
      hostRenderer = create(<Host />);
    });
    listeners.get("pointermove")?.({
      clientX: 40,
      clientY: 20,
    } as PointerEvent);

    expect(style.setProperty).toHaveBeenCalledWith(
      "--eyslie-pupil-x",
      expect.stringContaining("px"),
    );
    act(() => {
      create(<DisabledHost />);
      create(<NullHost />);
    });
    listeners.get("pointermove")?.({
      clientX: 20,
      clientY: 20,
    } as PointerEvent);
    expect(style.setProperty).toHaveBeenCalledWith("--eyslie-pupil-x", "0px");
    act(() => {
      hostRenderer?.unmount();
    });
    expect(listeners.has("pointermove")).toBe(false);

    globalThis.window = previousWindow;
  });

  it("updates proximity state only when near/far state changes", () => {
    const element = {
      getBoundingClientRect: () => ({
        left: 10,
        top: 10,
        right: 50,
        bottom: 40,
      }),
    } as unknown as HTMLElement;
    const ref = { current: element };
    const listeners = new Map<string, (event: PointerEvent) => void>();
    const previousWindow = globalThis.window;
    globalThis.window = {
      addEventListener: (type: string, listener: EventListener) => {
        listeners.set(type, listener as (event: PointerEvent) => void);
      },
      removeEventListener: (type: string) => {
        listeners.delete(type);
      },
    } as unknown as Window & typeof globalThis;
    const observed: boolean[] = [];

    function Host() {
      observed.push(useProximity(ref, { radius: 8 }));
      return null;
    }
    function DisabledHost() {
      observed.push(useProximity(ref, { disabled: true }));
      return null;
    }
    function NullHost() {
      observed.push(useProximity({ current: null }));
      return null;
    }

    let hostRenderer: ReturnType<typeof create> | undefined;
    act(() => {
      hostRenderer = create(<Host />);
    });
    act(() => {
      listeners.get("pointermove")?.({
        clientX: 12,
        clientY: 12,
      } as PointerEvent);
    });
    act(() => {
      listeners.get("pointermove")?.({
        clientX: 13,
        clientY: 13,
      } as PointerEvent);
    });
    act(() => {
      listeners.get("pointermove")?.({
        clientX: 100,
        clientY: 100,
      } as PointerEvent);
    });

    expect(observed).toContain(true);
    expect(observed.at(-1)).toBe(false);
    act(() => {
      create(<DisabledHost />);
      create(<NullHost />);
    });
    listeners.get("pointermove")?.({
      clientX: 10,
      clientY: 10,
    } as PointerEvent);
    act(() => {
      hostRenderer?.unmount();
    });
    expect(listeners.has("pointermove")).toBe(false);
    globalThis.window = previousWindow;
  });

  it("uses deterministic wink timing and disables timers on demand", () => {
    vi.useFakeTimers();
    const previousWindow = globalThis.window;
    globalThis.window = {
      setTimeout,
      clearTimeout,
    } as unknown as Window & typeof globalThis;
    const states: ReturnType<typeof useRandomWink>[] = [];

    function Host({ disabled = false }: { disabled?: boolean }) {
      states.push(useRandomWink({ seed: 2, disabled }));
      return null;
    }
    function DefaultHost() {
      states.push(useRandomWink({ testMode: true }));
      return null;
    }

    act(() => {
      create(<Host />);
    });
    expect(states.at(-1)?.isWinking).toBe(false);
    act(() => {
      vi.advanceTimersByTime(states.at(-1)?.nextDelayMs ?? 0);
    });
    expect(states.at(-1)?.winkIndex).toBe(1);

    act(() => {
      create(<Host disabled />);
      create(<DefaultHost />);
    });
    expect(states.at(-1)?.isWinking).toBe(false);

    globalThis.window = previousWindow;
    vi.useRealTimers();
  });
});

describe("hot path guard", () => {
  it("does not use React state on every pointermove", () => {
    const hookSource = useEyeTracking.toString();

    expect(hookSource).not.toContain("useState");
    expect(hookSource).not.toContain("setState");
    expect(hookSource).toContain("style.setProperty");
  });
});
