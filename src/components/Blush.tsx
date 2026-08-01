import type { ReactElement } from "react";

export type BlushProps = {
  active: boolean;
  side?: "left" | "right" | undefined;
};

export function Blush({ active, side }: BlushProps): ReactElement | null {
  if (!active) return null;
  if (side) {
    return (
      <span className="eyslie__cheek" data-side={side} aria-hidden="true" />
    );
  }

  return (
    <span className="eyslie__blush" aria-hidden="true">
      <span className="eyslie__cheek" data-side="left" />
      <span className="eyslie__cheek" data-side="right" />
    </span>
  );
}
