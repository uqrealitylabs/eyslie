import { type RefObject, useEffect } from "react";
import { getPupilOffsetFromRect } from "../math/eyeMath.js";

export function useEyeTracking(
  ref: RefObject<HTMLElement | null>,
  options: {
    disabled?: boolean | undefined;
  } = {},
) {
  useEffect(() => {
    const reset = () => {
      ref.current?.style.setProperty("--eyslie-pupil-x", "0px");
      ref.current?.style.setProperty("--eyslie-pupil-y", "0px");
    };

    if (options.disabled) {
      reset();
      return;
    }

    const onPointerMove = (event: PointerEvent) => {
      const element = ref.current;
      if (!element) return;
      const offset = getPupilOffsetFromRect(
        { x: event.clientX, y: event.clientY },
        element.getBoundingClientRect(),
      );
      element.style.setProperty("--eyslie-pupil-x", `${offset.x}px`);
      element.style.setProperty("--eyslie-pupil-y", `${offset.y}px`);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, [options.disabled, ref]);
}
