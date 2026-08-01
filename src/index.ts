export type { BlushProps } from "./components/Blush.js";
export { Blush } from "./components/Blush.js";
export type { LetterEyeProps } from "./components/LetterEye.js";
export { LetterEye } from "./components/LetterEye.js";
export type { ThoughtBubbleStyle } from "./components/ThoughtBubble.js";
export {
  ThoughtBubble,
  thoughtBubbleStyles,
} from "./components/ThoughtBubble.js";
export { useEyeTracking } from "./hooks/useEyeTracking.js";
export { useProximity } from "./hooks/useProximity.js";
export { useRandomWink } from "./hooks/useRandomWink.js";
export type {
  EyeLetterSelector,
  LivingTextProps,
  LivingTextThoughts,
} from "./LivingText.js";
export { LivingText } from "./LivingText.js";
export type { EyeBounds, Point, PointerRect } from "./math/eyeMath.js";
export {
  constrainPupilOffset,
  getPupilOffsetFromRect,
  isPointerNear,
} from "./math/eyeMath.js";
export type {
  EyeMarker,
  LivingTextEvent,
  LivingTextMood,
  MarkedEye,
} from "./state/livingTextMachine.js";
export {
  createWinkSchedule,
  defaultThoughts,
  eyeMarkers,
  getCheekAnchors,
  getOrganicWinkDelayMs,
  getThoughtForMood,
  isEyeEmoji,
  LIVING_TEXT_BLUSH_DELAY_MS,
  livingTextMoods,
  nextLivingTextMood,
  parseEyeMarkers,
  shouldShowBlush,
  splitTextLetters,
} from "./state/livingTextMachine.js";
export type {
  BlinkBehavior,
  ExpressionLevel,
  EyeShape,
  EyeStyle,
  GazeBehavior,
  LivingTextTheme,
  MouthStyle,
} from "./state/livingTextOptions.js";
export {
  blinkBehaviors,
  expressionLevels,
  eyeShapes,
  eyeStyles,
  gazeBehaviors,
  getExpressionLevel,
  livingTextThemes,
  mouthStyles,
} from "./state/livingTextOptions.js";
