import { describe, expect, it } from "vitest";
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
  livingTextMoods,
  nextLivingTextMood,
  shouldAnimateLivingText,
  shouldShowBlush,
  splitTextLetters,
  ThoughtBubble,
  useEyeTracking,
} from "../src";

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
  });

  it("keeps the pupil constrained inside the eye", () => {
    const offset = constrainPupilOffset(100, -80, { width: 20, height: 16 });

    expect(Math.abs(offset.x)).toBeLessThanOrEqual(5.6);
    expect(Math.abs(offset.y)).toBeLessThanOrEqual(3.84);
  });

  it("creates deterministic but non-constant wink delays", () => {
    const first = getOrganicWinkDelayMs(12, 0);
    const again = getOrganicWinkDelayMs(12, 0);
    const next = getOrganicWinkDelayMs(12, 1);

    expect(first).toBe(again);
    expect(first).not.toBe(next);
    expect(createWinkSchedule(12, 3)).toHaveLength(3);
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
});

describe("hot path guard", () => {
  it("does not use React state on every pointermove", () => {
    const hookSource = useEyeTracking.toString();

    expect(hookSource).not.toContain("useState");
    expect(hookSource).not.toContain("setState");
    expect(hookSource).toContain("style.setProperty");
  });
});
