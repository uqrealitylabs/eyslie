"use client";

import type { RefObject } from "react";
import * as React from "react";
import { getPupilOffsetFromRect } from "../math/eyeMath.js";

export function useEyeTracking(
  ref: RefObject<HTMLElement | null>,
  options: {
    disabled?: boolean | undefined;
    strength?: number | undefined;
  } = {},
) {
  const strength = Number.isFinite(options.strength)
    ? Math.max(0, Math.min(1, options.strength as number))
    : 1;
  React.useEffect(() => {
    const targets = () => {
      const root = ref.current;
      if (!root) return [];
      const eyes = root.querySelectorAll<HTMLElement>("[data-eye-role]");
      return eyes.length
        ? Array.from(eyes).filter(
            (eye) => eye.getAttribute?.("data-eye-emoji") !== "true",
          )
        : [root];
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
    reset();

    let frame: number | undefined;
    let active = false;
    let point = { x: 0, y: 0 };
    const cancelFrame = () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      frame = undefined;
    };
    const resetTracking = () => {
      cancelFrame();
      if (!active) return;
      active = false;
      reset();
    };
    const update = () => {
      frame = undefined;
      for (const element of targets()) {
        const eye =
          element.querySelector<HTMLElement>(".eyslie__inner-eye") ?? element;
        const offset = getPupilOffsetFromRect(
          point,
          eye.getBoundingClientRect(),
        );
        setOffset(element, offset.x * strength, offset.y * strength);
      }
    };
    const onPointerMove = (event: PointerEvent) => {
      active = true;
      point = { x: event.clientX, y: event.clientY };
      if (frame === undefined) frame = window.requestAnimationFrame(update);
    };
    const onPointerOut = (event: PointerEvent) => {
      if (event.relatedTarget === null) resetTracking();
    };
    const resetEvents = ["blur", "resize", "scroll"] as const;

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    for (const event of resetEvents) {
      window.addEventListener(event, resetTracking, true);
    }
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      for (const event of resetEvents) {
        window.removeEventListener(event, resetTracking, true);
      }
      cancelFrame();
    };
  }, [options.disabled, ref, strength]);
}
