export const livingTextMoods = {
  idleCurious: "idleCurious",
  nearStartled: "nearStartled",
  excited: "excited",
  blush: "blush",
  celebration: "celebration",
  sadShrivel: "sadShrivel",
  recovery: "recovery",
} as const;

export type LivingTextMood =
  (typeof livingTextMoods)[keyof typeof livingTextMoods];

export type LivingTextEvent =
  | "pointerNear"
  | "pointerAway"
  | "excite"
  | "blushElapsed"
  | "celebrate"
  | "sadden"
  | "recover";

export const LIVING_TEXT_BLUSH_DELAY_MS = 3000;

export type AffectVector = {
  valence: number;
  arousal: number;
  dominance: number;
  intensity: number;
};

export const livingTextEmotionNames = [
  "neutral",
  "calm",
  "contentment",
  "relief",
  "satisfaction",
  "joy",
  "amusement",
  "playfulness",
  "excitement",
  "interest",
  "curiosity",
  "focus",
  "determination",
  "admiration",
  "adoration",
  "affection",
  "awe",
  "surprise",
  "confusion",
  "awkwardness",
  "embarrassment",
  "shame",
  "guilt",
  "boredom",
  "tiredness",
  "sadness",
  "grief",
  "loneliness",
  "empathic-pain",
  "anxiety",
  "fear",
  "horror",
  "disgust",
  "contempt",
  "anger",
  "frustration",
  "nostalgia",
  "craving",
] as const;

export type LivingTextEmotionName = (typeof livingTextEmotionNames)[number];

export const livingTextEyeStyles = [
  "cartoon",
  "hand-drawn",
  "ink",
  "anime",
  "googly",
  "minimal",
  "soft-pastel",
  "geometric",
] as const;

export type LivingTextEyeStyle = (typeof livingTextEyeStyles)[number];

export type LivingTextEmotionParameters = AffectVector & {
  eyeOpenness: number;
  eyelidCurve: number;
  eyelidTilt: number;
  irisSize: number;
  pupilSize: number;
  gazeJitter: number;
  blinkFrequency: number;
  blinkDuration: number;
  tearAmount: number;
  blushAmount: number;
  tremble: number;
  damping: number;
  transitionDuration: number;
};

export const livingTextEmotionPresets: Record<
  LivingTextEmotionName,
  AffectVector
> = Object.fromEntries(
  livingTextEmotionNames.map((name, index) => [
    name,
    {
      valence: clampAffect((index - 18) / 18),
      arousal: clamp01(0.2 + (index % 8) / 10),
      dominance: clampAffect(((index * 3) % 11) / 5 - 1),
      intensity: clamp01(0.35 + (index % 5) / 10),
    },
  ]),
) as Record<LivingTextEmotionName, AffectVector>;

export const defaultThoughts = {
  nearStartled: "AWWWW",
  excited: "AWWWW",
  blush: "AWWWW",
  celebration: "yay",
  sadShrivel: "ow.",
  recovery: "aw.",
} satisfies Partial<Record<LivingTextMood, string>>;

export function splitTextLetters(text: string) {
  return Array.from(text);
}

export function shouldShowBlush(elapsedMs: number) {
  return elapsedMs >= LIVING_TEXT_BLUSH_DELAY_MS;
}

export function nextLivingTextMood(
  current: LivingTextMood,
  event: LivingTextEvent,
  elapsedMs = 0,
): LivingTextMood {
  if (event === "celebrate") return livingTextMoods.celebration;
  if (event === "sadden") return livingTextMoods.sadShrivel;
  if (event === "recover") return livingTextMoods.idleCurious;
  if (event === "excite") return livingTextMoods.excited;
  if (event === "blushElapsed") {
    return shouldShowBlush(elapsedMs) ? livingTextMoods.blush : current;
  }
  if (
    current !== livingTextMoods.idleCurious &&
    current !== livingTextMoods.nearStartled
  ) {
    return current;
  }

  return event === "pointerNear"
    ? livingTextMoods.nearStartled
    : livingTextMoods.idleCurious;
}

export function getThoughtForMood(
  mood: LivingTextMood,
  thoughts: Partial<Record<LivingTextMood, string>> = defaultThoughts,
) {
  return thoughts[mood] ?? "";
}

export function shouldAnimateLivingText(options: {
  reducedMotion?: boolean | undefined;
  testMode?: boolean | undefined;
}) {
  return !options.reducedMotion && !options.testMode;
}

export function resolveLivingTextEmotion(
  emotion: LivingTextEmotionName | AffectVector = "neutral",
  intensity = 1,
): LivingTextEmotionParameters {
  const affect =
    typeof emotion === "string" ? livingTextEmotionPresets[emotion] : emotion;
  const scaledIntensity = clamp01(affect.intensity * intensity);

  return {
    valence: clampAffect(affect.valence),
    arousal: clamp01(affect.arousal),
    dominance: clampAffect(affect.dominance),
    intensity: scaledIntensity,
    eyeOpenness: clamp01(0.55 + affect.valence * 0.18 + affect.arousal * 0.2),
    eyelidCurve: clampAffect(affect.valence * 0.7 - affect.dominance * 0.15),
    eyelidTilt: clampAffect(-affect.valence * 0.25 + affect.dominance * 0.35),
    irisSize: clamp01(0.42 + affect.arousal * 0.22),
    pupilSize: clamp01(0.34 + (1 - affect.dominance) * 0.12),
    gazeJitter: clamp01(affect.arousal * scaledIntensity),
    blinkFrequency: clamp01(0.2 + (1 - affect.arousal) * 0.45),
    blinkDuration: clamp01(0.2 + (1 - affect.valence) * 0.25),
    tearAmount: clamp01(Math.max(0, -affect.valence) * scaledIntensity),
    blushAmount: clamp01(Math.max(0, affect.valence) * scaledIntensity),
    tremble: clamp01(Math.max(0, affect.arousal - affect.dominance) * 0.5),
    damping: clamp01(0.35 + (1 - affect.arousal) * 0.45),
    transitionDuration: clamp01(0.2 + scaledIntensity * 0.55),
  };
}

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function clampAffect(value: number) {
  return Math.max(-1, Math.min(1, value));
}
