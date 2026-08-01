"use client";

import type { CSSProperties, ReactElement } from "react";
import * as React from "react";
import { Blush } from "./components/Blush.js";
import { LetterEye } from "./components/LetterEye.js";
import {
  ThoughtBubble,
  type ThoughtBubbleStyle,
} from "./components/ThoughtBubble.js";
import { useEyeTracking } from "./hooks/useEyeTracking.js";
import { useRandomWink } from "./hooks/useRandomWink.js";
import {
  defaultThoughts,
  getCheekAnchors,
  getThoughtForMood,
  type LivingTextMood,
  livingTextMoods,
  parseEyeMarkers,
  splitTextLetters,
} from "./state/livingTextMachine.js";
import {
  type BlinkBehavior,
  type ExpressionLevel,
  type EyeShape,
  type EyeStyle,
  type GazeBehavior,
  type LivingTextTheme,
  livingTextThemes,
} from "./state/livingTextOptions.js";

export type EyeLetterSelector = string | number;
export type LivingTextThoughts = Partial<Record<LivingTextMood, string>>;

export type LivingTextProps = {
  text: string;
  ariaLabel?: string | undefined;
  mood?: LivingTextMood | undefined;
  eyeMarkers?: boolean | undefined;
  eyeLetters?:
    | {
        primary?: EyeLetterSelector | undefined;
        secondary?: EyeLetterSelector | undefined;
      }
    | undefined;
  eyeShape?: EyeShape | undefined;
  eyeStyle?: EyeStyle | undefined;
  gaze?: GazeBehavior | undefined;
  blink?: BlinkBehavior | undefined;
  expression?: ExpressionLevel | undefined;
  bubbleStyle?: ThoughtBubbleStyle | undefined;
  theme?: LivingTextTheme | undefined;
  smile?: boolean | undefined;
  blush?: boolean | "auto" | undefined;
  thoughts?: LivingTextThoughts | undefined;
  idleColor?: string | undefined;
  excitedColor?: string | undefined;
  sadColor?: string | undefined;
  pupilColor?: string | undefined;
  eyeColor?: string | undefined;
  reducedMotion?: boolean | undefined;
  seed?: number | undefined;
  className?: string | undefined;
  style?: CSSProperties | undefined;
};

type ResolvedEye = {
  index: number;
  restGaze?: "left" | "up" | "right" | undefined;
};

export function LivingText({
  text,
  ariaLabel,
  mood = livingTextMoods.idleCurious,
  eyeMarkers = false,
  eyeLetters = { primary: "O", secondary: "U" },
  eyeShape = "round",
  eyeStyle = "classic",
  gaze = "follow",
  blink = "natural",
  expression = "playful",
  bubbleStyle = "cloud",
  theme = "classic",
  smile = false,
  blush = "auto",
  thoughts = defaultThoughts,
  idleColor,
  excitedColor,
  sadColor,
  pupilColor,
  eyeColor,
  reducedMotion = false,
  seed = 1,
  className,
  style,
}: LivingTextProps): ReactElement {
  const rootRef = React.useRef<HTMLSpanElement>(null);
  const primaryEye = eyeLetters?.primary;
  const secondaryEye = eyeLetters?.secondary;
  const content = React.useMemo(() => {
    if (eyeMarkers) {
      const marked = parseEyeMarkers(text);
      return {
        eyes: marked.eyes.map(({ index, gaze }) => ({
          index,
          restGaze: gaze,
        })),
        labelText: marked.text,
        letters: marked.letters,
      };
    }
    const letters = splitTextLetters(text);
    return {
      eyes: resolveLegacyEyes(letters, {
        primary: primaryEye,
        secondary: secondaryEye,
      }),
      labelText: text,
      letters,
    };
  }, [eyeMarkers, primaryEye, secondaryEye, text]);
  const { eyes, labelText, letters } = content;
  const label = ariaLabel?.trim()
    ? ariaLabel
    : labelText.trim()
      ? labelText
      : undefined;
  const followsPointer = gaze === "follow" || gaze === "softFollow";
  useEyeTracking(rootRef, {
    disabled: reducedMotion || !eyes.length || !followsPointer,
    strength: gaze === "softFollow" ? 0.55 : 1,
  });
  const winkEnabled =
    blink !== "none" && eyes.length >= (blink === "natural" ? 2 : 1);
  const wink = useRandomWink({ seed, disabled: reducedMotion || !winkEnabled });
  const winkTarget =
    blink === "natural"
      ? 1
      : (Math.max(1, wink.winkIndex) - 1) % Math.max(1, eyes.length);
  const safeTheme = Object.hasOwn(livingTextThemes, theme) ? theme : "classic";
  const cssVars = getCssVars({
    theme: safeTheme,
    idleColor,
    excitedColor,
    sadColor,
    eyeColor,
    pupilColor,
    style,
  });
  const cheeks = resolveCheeks(
    letters,
    blush === true || (blush === "auto" && mood === livingTextMoods.blush),
  );
  const eyesByIndex = new Map(
    eyes.map((eye, eyeIndex) => [eye.index, { ...eye, eyeIndex }]),
  );

  return (
    <span
      ref={rootRef}
      className={["eyslie", className].filter(Boolean).join(" ")}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": "true" })}
      data-mood={mood}
      data-eye-shape={eyeShape === "round" ? undefined : eyeShape}
      data-eye-style={eyeStyle === "classic" ? undefined : eyeStyle}
      data-gaze={gaze === "follow" ? undefined : gaze}
      data-expression={expression === "playful" ? undefined : expression}
      data-theme={safeTheme === "classic" ? undefined : safeTheme}
      data-smile={smile ? "true" : undefined}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={cssVars}
    >
      <span className="eyslie__letters" aria-hidden="true">
        {letters.map((letter, index) => {
          const eye = eyesByIndex.get(index);
          const blushSides = cheeks.get(index) ?? [];
          if (eye) {
            return (
              <LetterEye
                // biome-ignore lint/suspicious/noArrayIndexKey: Grapheme slots are positional and stateless.
                key={index}
                letter={letter}
                eyeRole={eye.eyeIndex === 0 ? "primary" : "secondary"}
                eyeIndex={eye.eyeIndex}
                restGaze={
                  eye.restGaze ??
                  (gaze === "sideGlance"
                    ? eye.eyeIndex % 2
                      ? "right"
                      : "left"
                    : undefined)
                }
                blushSides={blushSides}
                winking={wink.isWinking && eye.eyeIndex === winkTarget}
              />
            );
          }
          return (
            <span
              className="eyslie__letter"
              data-cheek={blushSides.length ? "true" : undefined}
              // biome-ignore lint/suspicious/noArrayIndexKey: Grapheme slots are positional and stateless.
              key={index}
            >
              {letter}
              {blushSides.map((side) => (
                <Blush active side={side} key={side} />
              ))}
            </span>
          );
        })}
      </span>
      <ThoughtBubble variant={bubbleStyle}>
        {getThoughtForMood(mood, thoughts)}
      </ThoughtBubble>
    </span>
  );
}

type ColorStyleOptions = Pick<
  LivingTextProps,
  | "idleColor"
  | "excitedColor"
  | "sadColor"
  | "eyeColor"
  | "pupilColor"
  | "style"
> & { theme: LivingTextTheme };

function getCssVars({
  theme,
  idleColor,
  excitedColor,
  sadColor,
  eyeColor,
  pupilColor,
  style,
}: ColorStyleOptions): CSSProperties {
  const vars = {} as CSSProperties & Record<string, string>;
  if (theme !== "classic") {
    const palette = livingTextThemes[theme];
    vars["--eyslie-idle-color"] = palette.idle;
    vars["--eyslie-excited-color"] = palette.excited;
    vars["--eyslie-sad-color"] = palette.sad;
    vars["--eyslie-eye-color"] = palette.eye;
    vars["--eyslie-pupil-color"] = palette.pupil;
    vars["--eyslie-blush-color"] = palette.blush;
    vars["--eyslie-bubble-color"] = palette.bubble;
    vars["--eyslie-bubble-text-color"] = palette.bubbleText;
  }
  if (idleColor !== undefined) vars["--eyslie-idle-color"] = idleColor;
  if (excitedColor !== undefined) vars["--eyslie-excited-color"] = excitedColor;
  if (sadColor !== undefined) vars["--eyslie-sad-color"] = sadColor;
  if (eyeColor !== undefined) vars["--eyslie-eye-color"] = eyeColor;
  if (pupilColor !== undefined) vars["--eyslie-pupil-color"] = pupilColor;
  return Object.assign(vars, style);
}

function resolveLegacyEyes(
  letters: string[],
  selectors: NonNullable<LivingTextProps["eyeLetters"]>,
): ResolvedEye[] {
  const primary = findLetterIndex(letters, selectors.primary);
  const secondary = findLetterIndex(letters, selectors.secondary);
  return [primary, secondary]
    .filter(
      (index, position, indexes) =>
        index >= 0 && indexes.indexOf(index) === position,
    )
    .map((index) => ({ index }));
}

function resolveCheeks(letters: string[], active: boolean) {
  const cheeks = new Map<number, ("left" | "right")[]>();
  const anchors = active ? getCheekAnchors(letters) : null;
  if (!anchors) return cheeks;
  cheeks.set(anchors.left, ["left"]);
  cheeks.set(anchors.right, [...(cheeks.get(anchors.right) ?? []), "right"]);
  return cheeks;
}

function findLetterIndex(
  letters: string[],
  selector: EyeLetterSelector | undefined,
) {
  if (selector === undefined) return -1;
  if (typeof selector === "number") {
    return Number.isInteger(selector) &&
      selector >= 0 &&
      selector < letters.length
      ? selector
      : -1;
  }
  const lowerSelector = selector.toLowerCase();
  if (/^\p{ASCII}*$/u.test(selector)) {
    return letters.findIndex(
      (letter) => letter.toLowerCase() === lowerSelector,
    );
  }
  const normalizedSelector = selector.normalize("NFC").toLowerCase();
  return letters.findIndex(
    (letter) => letter.normalize("NFC").toLowerCase() === normalizedSelector,
  );
}
