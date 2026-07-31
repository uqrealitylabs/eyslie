import { type RefObject, useEffect, useRef, useState } from "react";

export type PointerRect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function isPointerNear(
  rect: PointerRect,
  point: { x: number; y: number },
  radius: number,
) {
  const safeRadius = Number.isFinite(radius) ? Math.max(0, radius) : 0;
  return (
    point.x >= rect.left - safeRadius &&
    point.x <= rect.right + safeRadius &&
    point.y >= rect.top - safeRadius &&
    point.y <= rect.bottom + safeRadius
  );
}

export function useProximity(
  ref: RefObject<HTMLElement | null>,
  options: {
    radius?: number | undefined;
    disabled?: boolean | undefined;
  } = {},
) {
  const [near, setNear] = useState(false);
  const nearRef = useRef(false);
  const radius = options.radius ?? 80;

  useEffect(() => {
    if (options.disabled || typeof window === "undefined") {
      nearRef.current = false;
      setNear(false);
      return;
    }

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

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [options.disabled, radius, ref]);

  return options.disabled ? false : near;
}
