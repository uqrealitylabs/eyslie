export function Blush({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <span className="eyslie__blush" aria-hidden="true">
      <span />
      <span />
    </span>
  );
}
