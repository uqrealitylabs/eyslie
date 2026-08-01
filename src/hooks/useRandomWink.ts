"use client";

import * as React from "react";
import { createWinkSchedule } from "../state/livingTextMachine.js";

const WINK_DURATION_MS = 160;

export function useRandomWink(options: {
  seed?: number | undefined;
  disabled?: boolean | undefined;
}) {
  const seed = options.seed ?? 1;
  const [winkIndex, setWinkIndex] = React.useState(0);
  const [isWinking, setIsWinking] = React.useState(false);
  const schedule = React.useMemo(() => createWinkSchedule(seed), [seed]);

  React.useEffect(() => {
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
