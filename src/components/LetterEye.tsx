export type LetterEyeProps = {
  letter: string;
  eyeRole?: "primary" | "secondary" | undefined;
  winking?: boolean | undefined;
};

export function LetterEye({
  letter,
  eyeRole = "primary",
  winking = false,
}: LetterEyeProps) {
  return (
    <span
      className="eyslie__letter eyslie__letter--eye"
      data-eye-role={eyeRole}
      data-winking={winking ? "true" : "false"}
    >
      <span className="eyslie__glyph">{letter}</span>
      <span className="eyslie__inner-eye" />
      <span className="eyslie__pupil" />
    </span>
  );
}
