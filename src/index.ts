"use client";

export { Blush } from "./components/Blush.js";
export type { LetterEyeProps } from "./components/LetterEye.js";
export { LetterEye } from "./components/LetterEye.js";
export { ThoughtBubble } from "./components/ThoughtBubble.js";
export { useEyeTracking } from "./hooks/useEyeTracking.js";
export type { PointerRect } from "./hooks/useProximity.js";
export { isPointerNear, useProximity } from "./hooks/useProximity.js";
export {
  createWinkSchedule,
  getOrganicWinkDelayMs,
  useRandomWink,
} from "./hooks/useRandomWink.js";
export type {
  EyeLetterSelector,
  LivingTextProps,
  LivingTextThoughts,
} from "./LivingText.js";
export { LivingText } from "./LivingText.js";
export type { EyeBounds, Point } from "./math/eyeMath.js";
export {
  constrainPupilOffset,
  getPupilOffsetFromRect,
} from "./math/eyeMath.js";
export type {
  LivingTextEvent,
  LivingTextMood,
} from "./state/livingTextMachine.js";
export {
  defaultThoughts,
  getThoughtForMood,
  LIVING_TEXT_BLUSH_DELAY_MS,
  livingTextMoods,
  nextLivingTextMood,
  shouldShowBlush,
  splitTextLetters,
} from "./state/livingTextMachine.js";
