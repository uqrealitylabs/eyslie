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
export type { EyeBounds, EyeLetterParts, Point } from "./math/eyeMath.js";
export {
  constrainPupilOffset,
  getEyeLetterParts,
  getPupilOffsetFromRect,
} from "./math/eyeMath.js";
export type {
  AffectVector,
  LivingTextEmotionName,
  LivingTextEmotionParameters,
  LivingTextEvent,
  LivingTextEyeStyle,
  LivingTextMood,
} from "./state/livingTextMachine.js";
export {
  defaultThoughts,
  getThoughtForMood,
  LIVING_TEXT_BLUSH_DELAY_MS,
  livingTextEmotionNames,
  livingTextEmotionPresets,
  livingTextEyeStyles,
  livingTextMoods,
  nextLivingTextMood,
  resolveLivingTextEmotion,
  shouldAnimateLivingText,
  shouldShowBlush,
  splitTextLetters,
} from "./state/livingTextMachine.js";
