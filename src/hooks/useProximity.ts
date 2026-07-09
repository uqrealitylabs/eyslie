import { type RefObject, useEffect, useState } from "react";

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
  return (
    point.x >= rect.left - radius &&
    point.x <= rect.right + radius &&
    point.y >= rect.top - radius &&
    point.y <= rect.bottom + radius
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
  const radius = options.radius ?? 80;

  useEffect(() => {
    if (options.disabled) return;

    const onPointerMove = (event: PointerEvent) => {
      const element = ref.current;
      if (!element) return;
      const rect = element.getBoundingClientRect();
      setNear(
        isPointerNear(rect, { x: event.clientX, y: event.clientY }, radius),
      );
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [options.disabled, radius, ref]);

  return near;
}
