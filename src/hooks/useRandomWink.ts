import { useEffect, useMemo, useState } from "react";

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
  const schedule = useMemo(() => createWinkSchedule(seed), [seed]);

  useEffect(() => {
    if (options.disabled || options.testMode) return;

    const delay = schedule(winkIndex);
    const timer = window.setTimeout(() => {
      setWinkIndex((current) => current + 1);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [options.disabled, options.testMode, schedule, winkIndex]);

  return {
    isWinking: !options.disabled && winkIndex % 2 === 1,
    winkIndex,
    nextDelayMs: schedule(winkIndex),
  };
}
