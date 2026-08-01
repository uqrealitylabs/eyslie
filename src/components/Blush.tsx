import type { ReactElement } from "react";

export function Blush({ active }: { active: boolean }): ReactElement | null {
  if (!active) return null;

  return (
    <span className="eyslie__blush" aria-hidden="true">
      <span />
      <span />
    </span>
  );
}
