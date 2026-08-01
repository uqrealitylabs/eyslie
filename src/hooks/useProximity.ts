"use client";

import type { RefObject } from "react";
import * as React from "react";
import { isPointerNear } from "../math/eyeMath.js";

export function useProximity(
  ref: RefObject<HTMLElement | null>,
  options: {
    radius?: number | undefined;
    disabled?: boolean | undefined;
  } = {},
) {
  const [near, setNear] = React.useState(false);
  const nearRef = React.useRef(false);
  const radius = options.radius ?? 80;

  React.useEffect(() => {
    if (options.disabled || typeof window === "undefined") {
      nearRef.current = false;
      setNear(false);
      return;
    }

    const reset = () => {
      if (!nearRef.current) return;
      nearRef.current = false;
      setNear(false);
    };
    const onPointerMove = (event: PointerEvent) => {
      const element = ref.current;
      const nextNear = element
        ? isPointerNear(
            element.getBoundingClientRect(),
            { x: event.clientX, y: event.clientY },
            radius,
          )
        : false;
      if (nearRef.current === nextNear) return;

      nearRef.current = nextNear;
      setNear(nextNear);
    };
    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) reset();
    };
    const resetEvents = ["blur", "resize", "scroll"] as const;

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    for (const event of resetEvents) {
      window.addEventListener(event, reset, true);
    }
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      for (const event of resetEvents) {
        window.removeEventListener(event, reset, true);
      }
    };
  }, [options.disabled, radius, ref]);

  return options.disabled ? false : near;
}
