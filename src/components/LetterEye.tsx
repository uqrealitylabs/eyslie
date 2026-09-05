import type { CSSProperties, ReactElement } from "react";
import { isEyeEmoji } from "../state/livingTextMachine.js";
import { Blush } from "./Blush.js";

export type LetterEyeProps = {
  letter: string;
  eyeRole?: "primary" | "secondary" | undefined;
  eyeIndex?: number | undefined;
  restGaze?: "left" | "up" | "right" | undefined;
  fixedCenter?: boolean | undefined;
  blushSides?: readonly ("left" | "right")[] | undefined;
  winking?: boolean | undefined;
};

export function LetterEye({
  letter,
  eyeRole = "primary",
  eyeIndex,
  restGaze,
  fixedCenter = false,
  blushSides = [],
  winking = false,
}: LetterEyeProps): ReactElement {
  const syntheticEye = isEyeEmoji(letter);
  const hasFixedCenter = syntheticEye || fixedCenter;
  return (
    <span
      className="eyslie__letter eyslie__letter--eye"
      data-eye-role={eyeRole}
      data-eye-index={eyeIndex}
      data-rest-gaze={hasFixedCenter ? undefined : restGaze}
      data-eye-emoji={syntheticEye ? "true" : undefined}
      data-fixed-center={hasFixedCenter ? "true" : undefined}
      data-winking={winking ? "true" : "false"}
      {...(hasFixedCenter
        ? {
            style: {
              "--eyslie-pupil-x": "0px",
              "--eyslie-pupil-y": "0px",
            } as CSSProperties,
          }
        : {})}
    >
      <span className="eyslie__glyph">{letter}</span>
      <span className="eyslie__inner-eye" />
      <span className="eyslie__pupil" />
      {blushSides.map((side) => (
        <Blush active side={side} key={side} />
      ))}
    </span>
  );
}
