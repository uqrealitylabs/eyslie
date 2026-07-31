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

export const defaultThoughts: Partial<Record<LivingTextMood, string>> = {
  nearStartled: "AWWWW",
  excited: "AWWWW",
  blush: "AWWWW",
  celebration: "yay",
  sadShrivel: "ow.",
  recovery: "aw.",
};

const graphemeSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
});

export function splitTextLetters(text: string) {
  if (/^\p{ASCII}*$/u.test(text)) return text.split("");
  return Array.from(graphemeSegmenter.segment(text), ({ segment }) => segment);
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
