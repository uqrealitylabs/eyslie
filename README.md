# eyslie

Living text, eyes, winks, blush, bubbles, and small playful reactions for React.

## What It Is

`@uqrealitylabs/eyslie` turns plain text into accessible living letters. It was extracted from the UQ Reality Labs `JOIN US` interaction and keeps the reusable parts: an O eye, a U eyelid, pupil tracking, wink timing, mood transitions, thought bubbles, and reduced-motion support.

It is DOM/CSS/React only. No Three.js, no route logic, no website content graph.

## When To Use It

Use it when a wordmark, call-to-action, or short label should react to pointer proximity or an external state.

Do not use it for long paragraphs, layout-heavy navigation, or anything that must look identical in every browser font.

## Install

```sh
npm install @uqrealitylabs/eyslie
```

```tsx
import { LivingText } from "@uqrealitylabs/eyslie";
import "@uqrealitylabs/eyslie/styles.css";
```

## Basic Example

```tsx
import { LivingText, livingTextMoods } from "@uqrealitylabs/eyslie";

export function JoinButton() {
  return (
    <LivingText
      text="JOIN US"
      mood={livingTextMoods.idleCurious}
      eyeLetters={{ primary: "O", secondary: "U" }}
      thoughts={{ nearStartled: "AWWWW", celebration: "yay" }}
      ariaLabel="Join us"
    />
  );
}
```

> [!NOTE]
> The component renders animated letters as `aria-hidden` and keeps a readable `aria-label` on the wrapper.

## Concepts

### Living Letters

`splitTextLetters()` uses `Array.from()` so emoji and composed characters are not split as raw UTF-16 units. Select eye anchors by letter value or letter index.

### O Eye / U Eyelid

The primary eye keeps the original glyph visible, then layers a white eye interior and brown pupil inside it. The secondary eye can render as an eyelid/wink target.

### Moods

The reusable moods are:

- `idleCurious`
- `nearStartled`
- `excited`
- `blush`
- `celebration`
- `sadShrivel`
- `recovery`

### Thought Bubbles

Pass `thoughts` to override strings such as `AWWWW`, `aw.`, `ow.`, and `yay`.

### Reduced Motion

Set `reducedMotion` to suppress wink timers and cursor-following transforms. The static text remains readable.

## Accessibility Notes

Always pass `ariaLabel` when the visible text is decorative, stylised, or not the exact spoken phrase. The animated letter spans are hidden from assistive tech.

> [!WARNING]
> Do not use this package as the only label for a critical action unless the surrounding button or link also has a stable accessible name.

## Testing Notes

Deterministic helpers are exported from the main entry:

- `createWinkSchedule(seed)`
- `constrainPupilOffset(x, y, bounds)`
- `nextLivingTextMood(mood, event, elapsedMs)`
- `isPointerNear(rect, point, radius)`

## What This Package Does Not Do

- It does not navigate routes.
- It does not know about UQ content, Rubrics pages, or social links.
- It does not ship brand assets.
- It does not include animation libraries.

> [!TIP]
> Keep site-specific wrappers in the app. Let `eyslie` handle letter behaviour only.

## Development Commands

```sh
npm install
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
npm run demo:build
```

## License

See `LICENSE`.
