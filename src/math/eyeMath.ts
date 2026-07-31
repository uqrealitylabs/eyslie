export type Point = {
  x: number;
  y: number;
};

export type EyeBounds = {
  width: number;
  height: number;
};

export function constrainPupilOffset(
  pointerX: number,
  pointerY: number,
  bounds: EyeBounds,
): Point {
  const maxX = Number.isFinite(bounds.width)
    ? Math.max(0, bounds.width * 0.18)
    : 0;
  const maxY = Number.isFinite(bounds.height)
    ? Math.max(0, bounds.height * 0.09)
    : 0;
  if (
    !maxX ||
    !maxY ||
    !Number.isFinite(pointerX) ||
    !Number.isFinite(pointerY)
  ) {
    return { x: 0, y: 0 };
  }

  const scale = Math.max(1, Math.hypot(pointerX / maxX, pointerY / maxY));
  return {
    x: pointerX / scale,
    y: pointerY / scale,
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
