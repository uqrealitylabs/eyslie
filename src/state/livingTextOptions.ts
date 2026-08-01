export const eyeShapes = [
  "round",
  "almond",
  "square",
  "star",
  "heart",
  "visor",
  "diamond",
  "droplet",
] as const;
export type EyeShape = (typeof eyeShapes)[number];

export const eyeStyles = [
  "classic",
  "ink",
  "pixel",
  "neon",
  "cosmic",
  "paper",
  "outline",
  "gloss",
] as const;
export type EyeStyle = (typeof eyeStyles)[number];

export const gazeBehaviors = [
  "follow",
  "softFollow",
  "centered",
  "sideGlance",
  "wander",
  "scan",
] as const;
export type GazeBehavior = (typeof gazeBehaviors)[number];

export const blinkBehaviors = ["natural", "wink", "none"] as const;
export type BlinkBehavior = (typeof blinkBehaviors)[number];

export const expressionLevels = ["subtle", "playful", "theatrical"] as const;
export type ExpressionLevel = (typeof expressionLevels)[number];

export function getExpressionLevel(intensity: number): ExpressionLevel {
  const index = Number.isFinite(intensity) ? Math.round(intensity) : 1;
  return expressionLevels[
    Math.max(0, Math.min(expressionLevels.length - 1, index))
  ] as ExpressionLevel;
}

export const mouthStyles = [
  "none",
  "auto",
  "smile",
  "grin",
  "open",
  "flat",
  "frown",
  "pout",
] as const;
export type MouthStyle = (typeof mouthStyles)[number];

type LivingTextPalette = {
  idle: string;
  excited: string;
  sad: string;
  eye: string;
  pupil: string;
  blush: string;
  bubble: string;
  bubbleText: string;
};

export const livingTextThemes = {
  classic: {
    idle: "#d7261e",
    excited: "#f2b705",
    sad: "#2f6fed",
    eye: "#fffaf0",
    pupil: "#6b3f22",
    blush: "#ff8fa3",
    bubble: "#fffaf0",
    bubbleText: "#241c15",
  },
  harbourDawn: {
    idle: "#075985",
    excited: "#f97360",
    sad: "#475569",
    eye: "#f0f9ff",
    pupil: "#082f49",
    blush: "#fb7185",
    bubble: "#e0f2fe",
    bubbleText: "#082f49",
  },
  desertTwilight: {
    idle: "#c2410c",
    excited: "#fbbf24",
    sad: "#7e22ce",
    eye: "#fff7ed",
    pupil: "#431407",
    blush: "#fb7185",
    bubble: "#ffedd5",
    bubbleText: "#431407",
  },
  rainforestMist: {
    idle: "#047857",
    excited: "#84cc16",
    sad: "#0369a1",
    eye: "#ecfdf5",
    pupil: "#064e3b",
    blush: "#f472b6",
    bubble: "#d1fae5",
    bubbleText: "#052e16",
  },
  cityAfterDark: {
    idle: "#f472b6",
    excited: "#22d3ee",
    sad: "#818cf8",
    eye: "#fdf4ff",
    pupil: "#18181b",
    blush: "#fb7185",
    bubble: "#18181b",
    bubbleText: "#f0fdfa",
  },
  polarGlow: {
    idle: "#0f766e",
    excited: "#2dd4bf",
    sad: "#4f46e5",
    eye: "#f0fdfa",
    pupil: "#134e4a",
    blush: "#f9a8d4",
    bubble: "#ccfbf1",
    bubbleText: "#134e4a",
  },
  storybookInk: {
    idle: "#292524",
    excited: "#dc2626",
    sad: "#1d4ed8",
    eye: "#fffbeb",
    pupil: "#1c1917",
    blush: "#fda4af",
    bubble: "#fffbeb",
    bubbleText: "#1c1917",
  },
  retroArcade: {
    idle: "#e879f9",
    excited: "#fde047",
    sad: "#38bdf8",
    eye: "#faf5ff",
    pupil: "#3b0764",
    blush: "#fb7185",
    bubble: "#3b0764",
    bubbleText: "#fef08a",
  },
  tinyGalaxy: {
    idle: "#a78bfa",
    excited: "#facc15",
    sad: "#60a5fa",
    eye: "#faf5ff",
    pupil: "#312e81",
    blush: "#f0abfc",
    bubble: "#312e81",
    bubbleText: "#fefce8",
  },
  solarpunkGarden: {
    idle: "#15803d",
    excited: "#eab308",
    sad: "#2563eb",
    eye: "#f7fee7",
    pupil: "#14532d",
    blush: "#fb7185",
    bubble: "#ecfccb",
    bubbleText: "#14532d",
  },
} as const satisfies Record<string, LivingTextPalette>;

export type LivingTextTheme = keyof typeof livingTextThemes;
