export function ThoughtBubble({ children }: { children: string }) {
  if (!children) return null;

  return (
    <span className="eyslie__thought" aria-hidden="true">
      {children}
    </span>
  );
}
