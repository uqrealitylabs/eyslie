import type { CSSProperties } from "react";

export type LetterEyeProps = {
  letter: string;
  eyeRole?: "primary" | "secondary" | undefined;
  pupilOffset?: { x: number; y: number } | undefined;
  winking?: boolean | undefined;
};

export function LetterEye({
  letter,
  eyeRole = "primary",
  pupilOffset,
  winking = false,
}: LetterEyeProps) {
  const style = pupilOffset
    ? ({
        "--eyslie-pupil-x": `${pupilOffset.x}px`,
        "--eyslie-pupil-y": `${pupilOffset.y}px`,
      } as CSSProperties)
    : undefined;

  return (
    <span
      className="eyslie__letter eyslie__letter--eye"
      data-eye-role={eyeRole}
      data-winking={winking ? "true" : "false"}
      style={style}
    >
      <span className="eyslie__glyph">{letter}</span>
      <span className="eyslie__inner-eye" />
      <span className="eyslie__pupil" />
    </span>
  );
}
