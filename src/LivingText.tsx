import type { CSSProperties } from "react";
import { useMemo, useRef } from "react";
import { Blush } from "./components/Blush.js";
import { LetterEye } from "./components/LetterEye.js";
import { ThoughtBubble } from "./components/ThoughtBubble.js";
import { useEyeTracking } from "./hooks/useEyeTracking.js";
import { useRandomWink } from "./hooks/useRandomWink.js";
import {
  defaultThoughts,
  getThoughtForMood,
  type LivingTextMood,
  livingTextMoods,
  splitTextLetters,
} from "./state/livingTextMachine.js";

export type EyeLetterSelector = string | number;

export type LivingTextThoughts = Partial<Record<LivingTextMood, string>>;

export type LivingTextProps = {
  text: string;
  ariaLabel?: string | undefined;
  mood?: LivingTextMood | undefined;
  eyeLetters?:
    | {
        primary?: EyeLetterSelector | undefined;
        secondary?: EyeLetterSelector | undefined;
      }
    | undefined;
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

export function LivingText({
  text,
  ariaLabel,
  mood = livingTextMoods.idleCurious,
  eyeLetters = { primary: "O", secondary: "U" },
  thoughts = defaultThoughts,
  idleColor = "#d7261e",
  excitedColor = "#f2b705",
  sadColor = "#2f6fed",
  pupilColor = "#6b3f22",
  eyeColor = "#fffaf0",
  reducedMotion = false,
  seed = 1,
  className,
  style,
}: LivingTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const letters = useMemo(() => splitTextLetters(text), [text]);
  const primaryIndex = findLetterIndex(letters, eyeLetters.primary);
  const secondaryIndex = findLetterIndex(letters, eyeLetters.secondary);
  const hasPrimary = primaryIndex >= 0;
  const hasSecondary = secondaryIndex >= 0 && secondaryIndex !== primaryIndex;
  const label = ariaLabel?.trim() ? ariaLabel : text.trim() ? text : undefined;
  useEyeTracking(rootRef, {
    disabled: reducedMotion || (!hasPrimary && !hasSecondary),
  });
  const wink = useRandomWink({
    seed,
    disabled: reducedMotion || !hasSecondary,
  });
  const cssVars = {
    "--eyslie-idle-color": idleColor,
    "--eyslie-excited-color": excitedColor,
    "--eyslie-sad-color": sadColor,
    "--eyslie-eye-color": eyeColor,
    "--eyslie-pupil-color": pupilColor,
    ...style,
  } as CSSProperties;

  return (
    <span
      ref={rootRef}
      className={["eyslie", className].filter(Boolean).join(" ")}
      {...(label
        ? { role: "img", "aria-label": label }
        : { "aria-hidden": "true" })}
      data-mood={mood}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      style={cssVars}
    >
      <span className="eyslie__letters" aria-hidden="true">
        {letters.map((letter, index) => {
          const key = `${letter}-${index}`;
          if (index === primaryIndex) {
            return <LetterEye key={key} letter={letter} eyeRole="primary" />;
          }
          if (index === secondaryIndex && hasSecondary) {
            return (
              <LetterEye
                key={key}
                letter={letter}
                eyeRole="secondary"
                winking={wink.isWinking}
              />
            );
          }
          return (
            <span className="eyslie__letter" key={key}>
              {letter}
            </span>
          );
        })}
      </span>
      <Blush active={mood === livingTextMoods.blush} />
      <ThoughtBubble>{getThoughtForMood(mood, thoughts)}</ThoughtBubble>
    </span>
  );
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
