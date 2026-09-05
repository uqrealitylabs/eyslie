# eyslie

Expressive living text for React: eyes on any grapheme, gaze, winks, moods,
blush, emotion-linked mouths, thought bubbles, and original visual atmospheres.

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

- `<`, `^`, and `>` all mark the next character as an eye.
- Each marker keeps that eye centered and fixed to its own character.

Markers are removed from both the rendered word and its default accessible
label. Escape a literal marker or backslash with `\` (`\^`, `\<`, `\>`, `\\`).
A trailing marker stays literal. When several markers precede one grapheme, the
last direction wins.

Eye emoji are still an explicit exception: they always stay centred.

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
  mouth="auto"
/>
```

This displays and announces `WOW!`; both O and W keep centred eyes. Marker
parsing is opt-in, so ordinary `<`, `^`, and `>` text remains unchanged by
default.

The standalone `👁` and emoji-style `👁️` graphemes are always treated as a
single classic eye. Their platform glyph is visually replaced to avoid a
double eye, and their pupil stays centred even when tracking, scanning, or a
direction marker is active. The emoji remains in the accessible label.

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
| `eyeShape` | `round`, `almond`, `square`, `star`, `heart`, `visor`, `diamond`, `droplet` | `round` |
| `eyeStyle` | `classic`, `ink`, `pixel`, `neon`, `cosmic`, `paper`, `outline`, `gloss` | `classic` |
| `gaze` | `follow`, `softFollow`, `centered`, `sideGlance`, `wander`, `scan` | `follow` |
| `blink` | `natural`, `wink`, `none` | `natural` |
| `expression` | `subtle`, `playful`, `theatrical` | `playful` |
| `bubbleStyle` | `cloud`, `comic`, `whisper`, `pixel` | `cloud` |
| `theme` | any exported `livingTextThemes` key | `classic` |
| `mouth` | `none`, `auto`, `smile`, `grin`, `open`, `flat`, `frown`, `pout` | `none` |
| `smile` | deprecated boolean alias for `mouth="auto"` | `false` |
| `blush` | `"auto"`, `true`, `false` | `"auto"` |
| `thoughtLang` | BCP-47 language tag for thought text | unset |

`natural` blinks the second eye, matching the original O/U behaviour. `wink`
cycles through all resolved eyes and works with a single eye. Inline markers
support any number of eyes.

Blush cheeks are anchored to the visible characters near each text edge rather
than percentages of the component box. `blush="auto"` follows the blush mood;
`true` and `false` override it independently. `mouth="auto"` changes lip shape
with mood and only uses the shy pout when blush is actually visible. Eyslie is
intended for single-line words and short labels, not paragraphs or multiline
layout.

The demo's emotion spectrum combines an explicit mood with the three-stop
expression intensity. `getExpressionLevel(number)` clamps a 0–2 value and
resolves the nearest `subtle`, `playful`, or `theatrical` level, then the
complete locale phrase for that mood is selected. It never assembles translated
fragments or infers an emotion from a country.

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

### Localized Thoughts with Seer

The demo uses `@keys-i/seer` at build time to validate complete thought maps.
Seer never enters Eyslie's browser bundle or published runtime; the selected map
still reaches the component through the existing `thoughts` prop.

Language and expression are deliberately separate. A canonical BCP-47 locale
selects wording, while the explicit `expression` prop selects the shared
`subtle`, `playful`, or `theatrical` tone. A country never chooses a personality
or emotion automatically.

The demo resolves an exact locale, then a compatible language and script, then
base language when no script was requested. The `und` fallback suppresses the
thought bubble instead of guessing a language or culturally neutral reaction.
Starter packs are included for English, Spanish, Arabic, Japanese, and
Simplified Chinese; do not describe other locales as translated, and have native
speakers review copy used in a specific community.

Load Seer once at build or server start, select the complete map, and serialize
the same locale and thoughts into the first render so hydration is deterministic:

```tsx
<LivingText
  text="^H>I"
  eyeMarkers
  mood="celebration"
  expression={expression}
  thoughts={content.eyslie.thoughts[expression]}
  thoughtLang={locale}
/>
```

Thought bubbles use `dir="auto"` and bounded wrapping for RTL and longer text.
They are decorative and are not announced separately from `LivingText`'s stable
accessible name. If a reaction conveys meaning, announce it in the surrounding
application with a correctly tagged live region, as the demo does.

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

The published library supports Node.js 22.18 or newer. Repository development
uses Node.js 24.18 or newer because Seer is a build-time tool.

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
