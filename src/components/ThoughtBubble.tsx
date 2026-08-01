import type { ReactElement } from "react";

export const thoughtBubbleStyles = [
  "cloud",
  "comic",
  "whisper",
  "pixel",
] as const;
export type ThoughtBubbleStyle = (typeof thoughtBubbleStyles)[number];

export function ThoughtBubble({
  children,
  lang,
  variant = "cloud",
}: {
  children: string;
  lang?: string | undefined;
  variant?: ThoughtBubbleStyle | undefined;
}): ReactElement | null {
  if (!children) return null;

  return (
    <span
      className="eyslie__thought"
      data-bubble-style={variant}
      dir="auto"
      lang={lang}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
