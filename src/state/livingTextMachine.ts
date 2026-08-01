import { collectGraphemes } from "unicode-segmenter/grapheme";

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

export function getOrganicWinkDelayMs(seed: number, winkIndex: number) {
  const safeSeed = Number.isFinite(seed) ? seed % 1_000_000 : 1;
  const safeIndex = Number.isFinite(winkIndex) ? winkIndex % 1_000_000 : 0;
  const value =
    Math.sin((safeSeed + 1) * 12.9898 + safeIndex * 78.233) * 43758.5453;
  const unit = value - Math.floor(value);

  return Math.round(2600 + unit * 3600);
}

export function createWinkSchedule(seed: number) {
  return (winkIndex: number) => getOrganicWinkDelayMs(seed, winkIndex);
}

export const defaultThoughts: Partial<Record<LivingTextMood, string>> = {
  nearStartled: "AWWWW",
  excited: "AWWWW",
  blush: "AWWWW",
  celebration: "yay",
  sadShrivel: "ow.",
  recovery: "aw.",
};

export function splitTextLetters(text: string) {
  if (/^\p{ASCII}*$/u.test(text) && !text.includes("\r\n")) {
    return text.split("");
  }
  return collectGraphemes(text);
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
  return thoughts[mood] ?? defaultThoughts[mood] ?? "";
}
