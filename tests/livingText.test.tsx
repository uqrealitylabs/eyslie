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
  livingTextMoods,
  nextLivingTextMood,
  shouldAnimateLivingText,
  shouldShowBlush,
  splitTextLetters,
  ThoughtBubble,
  useEyeTracking,
  useProximity,
  useRandomWink,
} from "../src";

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
          eyeLetters={{ primary: 1, secondary: 4 }}
          testMode
        />,
      );
    });
    const tree = renderer?.toJSON();

    expect(JSON.stringify(tree)).toContain('"aria-label":"Join us"');
    expect(JSON.stringify(tree)).toContain('"data-eye-role":"primary"');
    expect(JSON.stringify(tree)).toContain('"data-eye-role":"secondary"');
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
