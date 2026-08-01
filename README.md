# eyslie

Expressive living text for React: eyes on any grapheme, gaze, winks, moods,
blush, optional smiles, thought bubbles, and original visual atmospheres.

`@uqrealitylabs/eyslie` is DOM/CSS/React only. It has no canvas, animation
framework, route logic, or bundled brand art.

## Install

```sh
npm install @uqrealitylabs/eyslie
```

The package is ESM-only. Import its CSS explicitly:

```tsx
import { LivingText } from "@uqrealitylabs/eyslie";
import "@uqrealitylabs/eyslie/styles.css";
```

## Put Eyes Anywhere

Turn on `eyeMarkers`, then place a marker immediately before any Unicode
grapheme:

- `<` gives the next character a resting left gaze.
- `^` gives the next character a resting upward gaze.
- `>` gives the next character a resting right gaze.

Markers are removed from both the rendered word and its default accessible
label. Escape a literal marker or backslash with `\` (`\^`, `\<`, `\>`, `\\`).
A trailing marker stays literal. When several markers precede one grapheme, the
last direction wins.

```tsx
<LivingText
  text="W^O>W!"
  eyeMarkers
  mood="excited"
  eyeShape="star"
  eyeStyle="cosmic"
  gaze="softFollow"
  blink="wink"
  expression="theatrical"
  bubbleStyle="comic"
  theme="tinyGalaxy"
  smile
/>
```

This displays and announces `WOW!`; the O looks up and the second W rests to
the right. Marker parsing is opt-in, so ordinary `<`, `^`, and `>` text remains
unchanged by default.

The original two-anchor API remains available:

```tsx
<LivingText
  text="JOIN US"
  eyeLetters={{ primary: "O", secondary: "U" }}
/>
```

Selectors may be a grapheme value or zero-based grapheme index.

## Expression Controls

The global controls stay orthogonal so an atmosphere never dictates an emotion
or behaviour:

| Prop | Values | Default |
| --- | --- | --- |
| `mood` | `idleCurious`, `nearStartled`, `excited`, `blush`, `celebration`, `sadShrivel`, `recovery` | `idleCurious` |
| `eyeShape` | `round`, `almond`, `square`, `star`, `heart`, `visor` | `round` |
| `eyeStyle` | `classic`, `ink`, `pixel`, `neon`, `cosmic`, `paper` | `classic` |
| `gaze` | `follow`, `softFollow`, `centered`, `sideGlance`, `wander`, `scan` | `follow` |
| `blink` | `natural`, `wink`, `none` | `natural` |
| `expression` | `subtle`, `playful`, `theatrical` | `playful` |
| `bubbleStyle` | `cloud`, `comic`, `whisper`, `pixel` | `cloud` |
| `theme` | any exported `livingTextThemes` key | `classic` |
| `smile` | boolean | `false` |
| `blush` | `"auto"`, `true`, `false` | `"auto"` |

`natural` blinks the second eye, matching the original O/U behaviour. `wink`
cycles through all resolved eyes and works with a single eye. Inline markers
support any number of eyes.

Blush cheeks are anchored to the visible characters near each text edge rather
than percentages of the component box. The optional smile is CSS-centred under
the word; Eyslie is intended for single-line words and short labels, not
paragraphs or multiline layout.

### Thoughts

Pass a partial mood map to replace or suppress the neutral defaults:

```tsx
<LivingText
  text="^H>I"
  eyeMarkers
  mood="celebration"
  thoughts={{ celebration: "hooray!", sadShrivel: "" }}
/>
```

### Atmospheres and Original Worlds

`livingTextThemes` contains original palettes such as `harbourDawn`,
`desertTwilight`, `rainforestMist`, `cityAfterDark`, `polarGlow`,
`storybookInk`, `retroArcade`, `tinyGalaxy`, and `solarpunkGarden`.

They change colour atmosphere only. They do not assign behaviours or emotions
to countries, cultures, or communities. No built-in theme copies a franchise,
character, logo, or signature protected design. Use the colour props or CSS
custom properties for a community-reviewed local palette or artwork you have
permission to use.

Explicit colour props override a selected theme, and values in `style` override
both:

```tsx
<LivingText
  text="^H>I"
  eyeMarkers
  theme="harbourDawn"
  excitedColor="#ff4f81"
  style={{ "--eyslie-blush-color": "#ef8baa" } as React.CSSProperties}
/>
```

## Accessibility and Motion

The animated letters are hidden from assistive technology. `LivingText` puts a
stable accessible name on its wrapper, automatically stripping inline control
markers. Pass `ariaLabel` when the spoken phrase should differ from the visible
text.

Do not use stylised living text as the only label for a critical action unless
the surrounding button or link also has a stable accessible name.

Set `reducedMotion` to disable JavaScript tracking and wink timers. CSS also
honours the operating system's reduced-motion preference while preserving fixed
marker gaze. Server output and the first client render are deterministic.

React Server Component frameworks keep `LivingText` and hooks behind their
client boundaries. Pure grapheme, marker, state, timing, and geometry helpers
remain callable from the package root on the server.

## Deterministic Helpers

The root export includes:

- `parseEyeMarkers(text)`
- `splitTextLetters(text)`
- `getCheekAnchors(letters)`
- `createWinkSchedule(seed)`
- `constrainPupilOffset(x, y, bounds)`
- `nextLivingTextMood(mood, event, elapsedMs)`
- `isPointerNear(rect, point, radius)`

## Interactive Demo

Run `npm run demo:dev`. A production build is written to `demo-dist/` by
`npm run demo:build`, and `npm run demo:preview` serves it locally.

GitHub Pages publishes the demo at <https://uqrealitylabs.com/eyslie/> with the
matching `/eyslie/` asset base. The display font is the existing OFL-licensed
Pixelify Sans asset; its notice remains beside the source and built asset.

## Development

Repository scripts require Node.js 22.18 or newer.

```sh
npm install
npm run typecheck
npm run lint
npm run format:check
npm run test
npm run build
npm run demo:build
npm run benchmark
```

## License

See `LICENSE`.
