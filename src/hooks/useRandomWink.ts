import { useEffect, useMemo, useState } from "react";

const WINK_DURATION_MS = 160;

export function getOrganicWinkDelayMs(seed: number, winkIndex: number) {
  const value =
    Math.sin((seed + 1) * 12.9898 + winkIndex * 78.233) * 43758.5453;
  const unit = value - Math.floor(value);

  return Math.round(2600 + unit * 3600);
}

export function createWinkSchedule(seed: number) {
  return (winkIndex: number) => getOrganicWinkDelayMs(seed, winkIndex);
}

export function useRandomWink(options: {
  seed?: number | undefined;
  disabled?: boolean | undefined;
  testMode?: boolean | undefined;
}) {
  const seed = options.seed ?? 1;
  const [winkIndex, setWinkIndex] = useState(0);
  const [isWinking, setIsWinking] = useState(false);
  const schedule = useMemo(() => createWinkSchedule(seed), [seed]);

  useEffect(() => {
    if (options.disabled || options.testMode || typeof window === "undefined") {
      setIsWinking(false);
      return;
    }

    const delay = schedule(winkIndex);
    const timer = window.setTimeout(() => {
      setIsWinking(true);
      setWinkIndex((current) => current + 1);
    }, delay);
    const resetTimer = isWinking
      ? window.setTimeout(() => setIsWinking(false), WINK_DURATION_MS)
      : undefined;

    return () => {
      window.clearTimeout(timer);
      if (resetTimer !== undefined) window.clearTimeout(resetTimer);
    };
  }, [isWinking, options.disabled, options.testMode, schedule, winkIndex]);

  return {
    isWinking: !options.disabled && isWinking,
    winkIndex,
    nextDelayMs: schedule(winkIndex),
  };
}
