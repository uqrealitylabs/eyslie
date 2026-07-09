export type Point = {
  x: number;
  y: number;
};

export type EyeBounds = {
  width: number;
  height: number;
};

export type EyeLetterParts = {
  glyph: string;
  hasInnerEye: true;
  hasPupil: true;
  keepsGlyphShape: true;
};

export function constrainPupilOffset(
  pointerX: number,
  pointerY: number,
  bounds: EyeBounds,
): Point {
  const maxX = Math.max(0, bounds.width * 0.28);
  const maxY = Math.max(0, bounds.height * 0.24);
  const length = Math.hypot(pointerX, pointerY);
  const maxLength = Math.hypot(maxX, maxY);

  if (!length || length <= maxLength) {
    return {
      x: clamp(pointerX, -maxX, maxX),
      y: clamp(pointerY, -maxY, maxY),
    };
  }

  const scale = maxLength / length;
  return {
    x: clamp(pointerX * scale, -maxX, maxX),
    y: clamp(pointerY * scale, -maxY, maxY),
  };
}

export function getPupilOffsetFromRect(
  pointer: Point,
  rect: DOMRect | { left: number; top: number; width: number; height: number },
) {
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  return constrainPupilOffset(pointer.x - centerX, pointer.y - centerY, {
    width: rect.width,
    height: rect.height,
  });
}

export function getEyeLetterParts(glyph: string): EyeLetterParts {
  return {
    glyph,
    hasInnerEye: true,
    hasPupil: true,
    keepsGlyphShape: true,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
