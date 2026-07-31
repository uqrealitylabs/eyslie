import { type RefObject, useEffect } from "react";
import { getPupilOffsetFromRect } from "../math/eyeMath.js";

export function useEyeTracking(
  ref: RefObject<HTMLElement | null>,
  options: {
    disabled?: boolean | undefined;
  } = {},
) {
  useEffect(() => {
    const targets = () => {
      const root = ref.current;
      if (!root) return [];
      const eyes = root.querySelectorAll<HTMLElement>("[data-eye-role]");
      return eyes.length ? eyes : [root];
    };
    const setOffset = (element: HTMLElement, x: number, y: number) => {
      element.style.setProperty("--eyslie-pupil-x", `${x}px`);
      element.style.setProperty("--eyslie-pupil-y", `${y}px`);
    };
    const reset = () => {
      for (const element of targets()) setOffset(element, 0, 0);
    };

    if (options.disabled || typeof window === "undefined") {
      reset();
      return;
    }

    let frame: number | undefined;
    let point = { x: 0, y: 0 };
    const update = () => {
      frame = undefined;
      for (const element of targets()) {
        const eye =
          element.querySelector<HTMLElement>(".eyslie__inner-eye") ?? element;
        const offset = getPupilOffsetFromRect(
          point,
          eye.getBoundingClientRect(),
        );
        setOffset(element, offset.x, offset.y);
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      point = { x: event.clientX, y: event.clientY };
      if (frame === undefined) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      if (frame !== undefined) window.cancelAnimationFrame(frame);
    };
  }, [options.disabled, ref]);
}
