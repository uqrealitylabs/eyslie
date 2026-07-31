import { useEffect, useMemo, useState } from "react";

const WINK_DURATION_MS = 160;

export function getOrganicWinkDelayMs(seed: number, winkIndex: number) {
  const safeSeed = Number.isFinite(seed) ? seed % 1_000_000 : 1;
  const safeIndex = Number.isFinite(winkIndex) ? winkIndex % 1_000_000 : 0;
  const value =
    Math.sin((safeSeed + 1) * 12.9898 + safeIndex * 78.233) * 43758.5453;
  const unit = value - Math.floor(value);

  return Math.round(2600 + unit * 3600);
}

export function createWinkSchedule(seed: number) {
  return (winkIndex: number) => getOrganicWinkDelayMs(seed, winkIndex);
}

export function useRandomWink(options: {
  seed?: number | undefined;
  disabled?: boolean | undefined;
}) {
  const seed = options.seed ?? 1;
  const [winkIndex, setWinkIndex] = useState(0);
  const [isWinking, setIsWinking] = useState(false);
  const schedule = useMemo(() => createWinkSchedule(seed), [seed]);

  useEffect(() => {
    if (options.disabled || typeof window === "undefined") {
      setIsWinking(false);
      return;
    }

    const timer = window.setTimeout(
      isWinking
        ? () => setIsWinking(false)
        : () => {
            setIsWinking(true);
            setWinkIndex((current) => current + 1);
          },
      isWinking ? WINK_DURATION_MS : schedule(winkIndex),
    );

    return () => window.clearTimeout(timer);
  }, [isWinking, options.disabled, schedule, winkIndex]);

  return {
    isWinking: !options.disabled && isWinking,
    winkIndex,
    nextDelayMs: schedule(winkIndex),
  };
}
