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
  variant = "cloud",
}: {
  children: string;
  variant?: ThoughtBubbleStyle | undefined;
}): ReactElement | null {
  if (!children) return null;

  return (
    <span
      className="eyslie__thought"
      data-bubble-style={variant}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
