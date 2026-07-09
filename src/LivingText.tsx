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
  shouldAnimateLivingText,
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
  testMode?: boolean | undefined;
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
  testMode = false,
  seed = 1,
  className,
  style,
}: LivingTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const animate = shouldAnimateLivingText({ reducedMotion, testMode });
  useEyeTracking(rootRef, { disabled: !animate });
  const wink = useRandomWink({ seed, disabled: !animate, testMode });
  const letters = useMemo(() => splitTextLetters(text), [text]);
  const primaryIndex = findLetterIndex(letters, eyeLetters.primary);
  const secondaryIndex = findLetterIndex(letters, eyeLetters.secondary);
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
      role="img"
      aria-label={ariaLabel ?? text}
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
          if (index === secondaryIndex) {
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
  if (typeof selector === "number") return selector;
  return letters.findIndex(
    (letter) => letter.toLowerCase() === selector.toLowerCase(),
  );
}
