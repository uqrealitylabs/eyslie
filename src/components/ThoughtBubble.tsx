import type { ReactElement } from "react";

export function ThoughtBubble({
  children,
}: {
  children: string;
}): ReactElement | null {
  if (!children) return null;

  return (
    <span className="eyslie__thought" aria-hidden="true">
      {children}
    </span>
  );
}
