import type { CSSProperties, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Blush } from "./components/Blush.js";
import { LetterEye } from "./components/LetterEye.js";
import { ThoughtBubble } from "./components/ThoughtBubble.js";
import { useEyeTracking } from "./hooks/useEyeTracking.js";
import { useRandomWink } from "./hooks/useRandomWink.js";
import {
  type AffectVector,
  defaultThoughts,
  getThoughtForMood,
  type LivingTextEmotionName,
  type LivingTextEyeStyle,
  type LivingTextMood,
  livingTextMoods,
  resolveLivingTextEmotion,
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
  siteReady?: boolean | undefined;
  ready?: boolean | undefined;
  onReady?: (() => void) | undefined;
  emotion?: LivingTextEmotionName | undefined;
  affect?: AffectVector | undefined;
  emotionIntensity?: number | undefined;
  eyeStyle?: LivingTextEyeStyle | undefined;
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
  siteReady = true,
  ready,
  onReady,
  emotion = "neutral",
  affect,
  emotionIntensity = 1,
  eyeStyle = "cartoon",
  seed = 1,
  className,
  style,
}: LivingTextProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const measuredReady = useLivingTextReadiness(rootRef, {
    ready,
    siteReady,
    testMode,
    onReady,
    text,
  });
  const animate =
    measuredReady && shouldAnimateLivingText({ reducedMotion, testMode });
  useEyeTracking(rootRef, { disabled: !animate });
  const wink = useRandomWink({ seed, disabled: !animate, testMode });
  const letters = useMemo(() => splitTextLetters(text), [text]);
  const emotionParameters = resolveLivingTextEmotion(
    affect ?? emotion,
    emotionIntensity,
  );
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
      data-ready={measuredReady ? "true" : "false"}
      data-eye-style={eyeStyle}
      data-emotion={emotion}
      data-reduced-motion={reducedMotion ? "true" : "false"}
      data-eye-openness={emotionParameters.eyeOpenness.toFixed(2)}
      style={cssVars}
    >
      <span className="eyslie__letters" aria-hidden="true">
        {letters.map((letter, index) => {
          const key = `${letter}-${index}`;
          if (measuredReady && index === primaryIndex) {
            return <LetterEye key={key} letter={letter} eyeRole="primary" />;
          }
          if (measuredReady && index === secondaryIndex) {
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

function useLivingTextReadiness(
  rootRef: RefObject<HTMLElement | null>,
  options: {
    ready?: boolean | undefined;
    siteReady: boolean;
    testMode: boolean;
    text: string;
    onReady?: (() => void) | undefined;
  },
) {
  const hasBrowser =
    typeof window !== "undefined" && typeof document !== "undefined";
  const [measuredReady, setMeasuredReady] = useState(
    options.ready ?? (!hasBrowser || options.testMode),
  );

  useEffect(() => {
    if (options.ready !== undefined) {
      setMeasuredReady(options.ready);
      if (options.ready) options.onReady?.();
      return;
    }
    if (!hasBrowser || options.testMode) {
      setMeasuredReady(true);
      options.onReady?.();
      return;
    }
    if (!options.siteReady) {
      setMeasuredReady(false);
      return;
    }

    let cancelled = false;
    let observer: ResizeObserver | undefined;
    let frame = 0;
    const scheduleFrame = window.requestAnimationFrame ?? window.setTimeout;
    const cancelFrame = window.cancelAnimationFrame ?? window.clearTimeout;

    const markReady = () => {
      const rect = rootRef.current?.getBoundingClientRect();
      const nextReady = Boolean(
        options.text.length > 0 && rect && rect.width > 0 && rect.height > 0,
      );
      if (cancelled) return;
      setMeasuredReady(nextReady);
      if (nextReady) options.onReady?.();
    };
    const afterFonts = async () => {
      await document.fonts?.ready;
      frame = scheduleFrame(() => {
        frame = scheduleFrame(markReady);
      }) as number;
    };

    observer = new ResizeObserver(markReady);
    if (rootRef.current) observer.observe(rootRef.current);
    void afterFonts();

    return () => {
      cancelled = true;
      observer?.disconnect();
      cancelFrame(frame);
    };
  }, [
    hasBrowser,
    options.ready,
    options.siteReady,
    options.testMode,
    options.text,
    options.onReady,
    rootRef,
  ]);

  return measuredReady;
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
