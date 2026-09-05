import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  blinkBehaviors,
  expressionLevels,
  eyeShapes,
  eyeStyles,
  gazeBehaviors,
  getExpressionLevel,
  LivingText,
  type BlinkBehavior,
  type EyeShape,
  type EyeStyle,
  type GazeBehavior,
  type LivingTextMood,
  type LivingTextTheme,
  type MouthStyle,
  livingTextMoods,
  livingTextThemes,
  mouthStyles,
  type ThoughtBubbleStyle,
  thoughtBubbleStyles,
} from "../../../dist/index.js";
import "@uqrealitylabs/eyslie/styles.css";
import {
  type DemoLocaleCatalog,
  resolveThoughtLocale,
} from "./locales.js";
import "./styles.css";

declare const __EYSLIE_LOCALES__: DemoLocaleCatalog;

const moodOptions: LivingTextMood[] = Object.values(livingTextMoods);
const themeOptions = Object.keys(livingTextThemes) as LivingTextTheme[];
const localeCatalog = __EYSLIE_LOCALES__;
const moodSpectrum: Record<LivingTextMood, string> = {
  [livingTextMoods.idleCurious]: "#a5f3fc",
  [livingTextMoods.nearStartled]: "#facc15",
  [livingTextMoods.excited]: "#f97316",
  [livingTextMoods.blush]: "#f472b6",
  [livingTextMoods.celebration]: "#c084fc",
  [livingTextMoods.sadShrivel]: "#60a5fa",
  [livingTextMoods.recovery]: "#34d399",
};
const mostSpokenLanguages = [
  "en",
  "zh",
  "es",
  "hi",
  "ar",
  "bn",
  "pt",
  "ru",
  "ur",
  "id",
  "de",
  "ja",
  "sw",
  "mr",
  "te",
  "tr",
  "ko",
  "vi",
  "ta",
  "it",
  "fr",
  "th",
  "fa",
  "pl",
  "ro",
  "uk",
  "nl",
  "ms",
  "el",
  "cs",
  "sv",
  "fi",
  "hu",
  "bg",
  "sr",
  "hr",
  "sk",
  "sl",
  "lt",
  "ne",
  "he",
  "gu",
  "kn",
  "ml",
  "pa",
  "jv",
  "my",
  "tl",
  "am",
  "mk",
] as const;
const mostSpokenLanguageSet = new Set<string>(mostSpokenLanguages);
const defaultLanguage = "en";
const languageNames = new Intl.DisplayNames(["en"], { type: "language" });
const moodWheelGradient = moodOptions
  .map(
    (mood, index) =>
      `${moodSpectrum[mood]} ${(index / moodOptions.length) * 100}% ${(
        index + 1
      ) / moodOptions.length * 100}%`,
  )
  .join(", ");

type Preset = {
  name: string;
  note: string;
  text: string;
  theme: LivingTextTheme;
  shape: EyeShape;
  eyeStyle: EyeStyle;
  gaze: GazeBehavior;
  bubble: ThoughtBubbleStyle;
};

const presets: Preset[] = [
  {
    name: "Harbour dawn",
    note: "salt air / soft focus",
    text: "S^E>A",
    theme: "harbourDawn",
    shape: "almond",
    eyeStyle: "paper",
    gaze: "softFollow",
    bubble: "whisper",
  },
  {
    name: "Tiny galaxy",
    note: "pocket-sized wonder",
    text: "W^O>W",
    theme: "tinyGalaxy",
    shape: "star",
    eyeStyle: "cosmic",
    gaze: "wander",
    bubble: "cloud",
  },
  {
    name: "Retro arcade",
    note: "bright / bleepy / bold",
    text: "P<L>A>Y",
    theme: "retroArcade",
    shape: "square",
    eyeStyle: "pixel",
    gaze: "scan",
    bubble: "pixel",
  },
  {
    name: "Storybook ink",
    note: "wobbly lines / warm paper",
    text: "O^N>C>E",
    theme: "storybookInk",
    shape: "round",
    eyeStyle: "ink",
    gaze: "sideGlance",
    bubble: "comic",
  },
  {
    name: "Solar garden",
    note: "sunny, leafy optimism",
    text: "G^R>O<W",
    theme: "solarpunkGarden",
    shape: "heart",
    eyeStyle: "classic",
    gaze: "follow",
    bubble: "cloud",
  },
  {
    name: "City after dark",
    note: "electric night energy",
    text: "H<E>Y!",
    theme: "cityAfterDark",
    shape: "visor",
    eyeStyle: "neon",
    gaze: "scan",
    bubble: "comic",
  },
];

function App() {
  const [text, setText] = useState("W^O>W!");
  const [mood, setMood] = useState<LivingTextMood>(livingTextMoods.excited);
  const [theme, setTheme] = useState<LivingTextTheme>("retroArcade");
  const [shape, setShape] = useState<EyeShape>("star");
  const [eyeStyle, setEyeStyle] = useState<EyeStyle>("cosmic");
  const [gaze, setGaze] = useState<GazeBehavior>("follow");
  const [blink, setBlink] = useState<BlinkBehavior>("wink");
  const [intensity, setIntensity] = useState(2);
  const [bubble, setBubble] = useState<ThoughtBubbleStyle>("comic");
  const [mouth, setMouth] = useState<MouthStyle>("auto");
  const [blush, setBlush] = useState<boolean | "auto">("auto");
  const [locale, setLocale] = useState("en");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isDarkMode, setDarkMode] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = isDarkMode ? "dark" : "light";
  }, [isDarkMode]);
  const catalogWithFallbacks = useMemo(() => {
    const fallback = localeCatalog[defaultLanguage] ?? localeCatalog.und;
    if (!fallback) return localeCatalog;
    return Object.fromEntries(
      [...mostSpokenLanguages, ...Object.keys(localeCatalog)].map((code) => {
        const existing = localeCatalog[code];
        if (existing) return [code, existing];
        return [
          code,
          {
            ...fallback,
            label: languageNames.of(code) ?? code,
          },
        ];
      }),
    ) as DemoLocaleCatalog;
  }, []);
  const localeOptions = [
    ...mostSpokenLanguages,
    ...Object.keys(localeCatalog).filter(
      (code) => !mostSpokenLanguageSet.has(code),
    ),
  ];
  const thoughtLocale = resolveThoughtLocale(
    catalogWithFallbacks,
    locale,
    defaultLanguage,
  );
  const catalogLocale = resolveThoughtLocale(localeCatalog, locale);
  const displayLocaleContent =
    catalogWithFallbacks[thoughtLocale] ?? localeCatalog.und;
  const resolvedThoughtLocale =
    catalogLocale === "und" ? "und" : thoughtLocale;
  const localeContent =
    catalogWithFallbacks[resolvedThoughtLocale] ?? localeCatalog.und;
  const thoughtLanguage =
    catalogLocale === "und" ? undefined : catalogLocale;
  const expression = getExpressionLevel(intensity);
  const localizedThoughts = localeContent.thoughts[expression];
  const localizedThought = localizedThoughts[mood];
  const thoughtAnnouncement =
    localizedThought || (catalogLocale === "und" ? localeContent.label : "");

  function reset() {
    setText("W^O>W!");
    setMood(livingTextMoods.excited);
    setTheme("retroArcade");
    setShape("star");
    setEyeStyle("cosmic");
    setGaze("follow");
    setBlink("wink");
    setIntensity(2);
    setBubble("comic");
    setMouth("auto");
    setBlush("auto");
    setLocale("en");
    setReducedMotion(false);
  }

  function usePreset(preset: Preset) {
    setText(preset.text);
    setTheme(preset.theme);
    setShape(preset.shape);
    setEyeStyle(preset.eyeStyle);
    setGaze(preset.gaze);
    setBubble(preset.bubble);
  }

  return (
    <div className="demo-shell" data-theme={isDarkMode ? "dark" : "light"}>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Eyslie home">
          <span className="brand-face" aria-hidden="true">
            ◉‿◉
          </span>
          <span>Eyslie</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#lab">Expression lab</a>
          <a href="#worlds">Worlds</a>
          <a href="https://github.com/uqrealitylabs/eyslie" rel="noreferrer">
            GitHub ↗
          </a>
          <button
            className="text-button theme-toggle"
            type="button"
            aria-pressed={isDarkMode}
            onClick={() => setDarkMode((value) => !value)}
          >
            {isDarkMode ? "☀️ Light mode" : "🌙 Dark mode"}
          </button>
        </nav>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="kicker">LIVING TEXT FOR REACT</p>
            <h1>Put eyes on anything.</h1>
            <p className="hero-lede">
              Point. Blink. Blush. Wonder. Turn any grapheme into an eye and
              give short words a surprisingly big personality.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#lab">
                Make a face ↓
              </a>
              <code>npm i @uqrealitylabs/eyslie</code>
            </div>
          </div>
          <div className="hero-creature">
            <span className="burst burst-one" aria-hidden="true">
              ✦
            </span>
            <LivingText
              text="H^E>Y!"
              eyeMarkers
              mood={livingTextMoods.celebration}
              theme="cityAfterDark"
              eyeShape="heart"
              eyeStyle="neon"
              gaze="wander"
              blink="wink"
              expression="theatrical"
              mouth="auto"
              thoughts={localeContent.thoughts.theatrical}
              thoughtLang={thoughtLanguage}
            />
            <span className="burst burst-two" aria-hidden="true">
              ✺
            </span>
          </div>
        </section>

        <section className="marker-strip" aria-labelledby="marker-title">
          <div>
            <p className="kicker">THE TINY SYNTAX</p>
            <h2 id="marker-title">Aim the next character.</h2>
          </div>
          <div className="marker-list">
            <span>
              <code>&lt;</code> looks left
            </span>
            <span>
              <code>^</code> looks up
            </span>
            <span>
              <code>&gt;</code> looks right
            </span>
          </div>
          <p>
            Markers disappear from the visible and spoken word. Escape a
            literal marker with <code>{"\\^"}</code>. A trailing marker stays
            literal.
          </p>
        </section>

        <section className="lab section-block" id="lab" aria-labelledby="lab-title">
          <div className="section-heading">
            <p className="kicker">EXPRESSION LAB</p>
            <h2 id="lab-title">Make it feel alive.</h2>
            <p>
              Choose a mood or move your pointer around the stage, then mix
              shape, motion, language and atmosphere. Mood and intensity select
              the words; locale never selects a personality.
            </p>
          </div>

          <div className="lab-layout">
            <div
              className="living-stage"
              data-reduced-motion={reducedMotion ? "true" : "false"}
              onPointerEnter={() =>
                setMood((current) =>
                  current === livingTextMoods.idleCurious
                    ? livingTextMoods.nearStartled
                    : current,
                )
              }
              onPointerLeave={() =>
                setMood((current) =>
                  current === livingTextMoods.nearStartled
                    ? livingTextMoods.idleCurious
                    : current,
                )
              }
            >
              <div className="stage-topline">
                <span>LIVE SPECIMEN</span>
                <span className="live-status">
                  <span className="live-dot" aria-hidden="true">
                    ●
                  </span>
                  <span>running</span>
                  <span className="live-ellipsis" aria-hidden="true">
                    <span>.</span>
                    <span>.</span>
                    <span>.</span>
                  </span>
                </span>
              </div>
              <div className="stage-scroll">
                <div className="living-word" data-testid="living-text-demo">
                  <LivingText
                    text={text || " "}
                    ariaLabel={text ? undefined : "Empty living text"}
                    eyeMarkers
                    mood={mood}
                    theme={theme}
                    eyeShape={shape}
                    eyeStyle={eyeStyle}
                    gaze={gaze}
                    blink={blink}
                    expression={expression}
                    bubbleStyle={bubble}
                    thoughts={localizedThoughts}
                    thoughtLang={thoughtLanguage}
                    mouth={mouth}
                    blush={blush}
                    reducedMotion={reducedMotion}
                  />
                </div>
              </div>
              <p className="stage-status">
                <span>
                  {formatLabel(mood)} ·{" "}
                  <span lang={thoughtLanguage} dir="auto">
                    {displayLocaleContent.label}
                  </span>{" "}
                  · {formatLabel(expression)} · {formatLabel(theme)}
                </span>
                <span
                  className="sr-only"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {formatLabel(mood)}, {formatLabel(expression)}. {" "}
                  <span
                    lang={localizedThought ? thoughtLanguage : undefined}
                    dir="auto"
                  >
                    {thoughtAnnouncement}
                  </span>
                </span>
              </p>
            </div>

            <form className="control-panel" onSubmit={(event) => event.preventDefault()}>
              <div className="panel-heading">
                <div>
                  <p className="kicker">YOUR MIX</p>
                  <h3>Direct the character</h3>
                </div>
                <button className="text-button" type="button" onClick={reset}>
                  Reset
                </button>
              </div>

              <label className="control-field control-wide">
                <span>Marked-up text</span>
                <input
                  value={text}
                  maxLength={18}
                  spellCheck="false"
                  onChange={(event) => setText(event.target.value)}
                />
                <small>
                  Try C^O&gt;O&lt;L or 👁️ — an eye emoji stays centred.
                </small>
              </label>

              <fieldset className="mood-field control-wide">
                <legend>Emotion spectrum</legend>
                <p className="field-hint">
                  Pick the feeling, then tune how strongly it speaks.
                </p>
                <div
                  className="emotion-wheel"
                  style={{
                    background: `conic-gradient(${moodWheelGradient})`,
                  }}
                >
                  {moodOptions.map((option, index) => {
                    const angle =
                      (360 / moodOptions.length) * index - 90;
                    const radians = (angle * Math.PI) / 180;
                    const radius = 43;
                    return (
                      <label
                        key={option}
                        className={`emotion-wheel-option ${
                          mood === option ? "is-active" : ""
                        }`}
                        style={{
                          left: `${50 + radius * Math.cos(radians)}%`,
                          top: `${50 + radius * Math.sin(radians)}%`,
                          transform: "translate(-50%, -50%)",
                        }}
                      >
                        <input
                          type="radio"
                          name="mood"
                          value={option}
                          checked={mood === option}
                          onChange={() => setMood(option)}
                        />
                        <span
                          className="emotion-wheel-pin"
                          style={{ background: moodSpectrum[option] }}
                        />
                        <span className="emotion-wheel-label">
                          {formatLabel(option)}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <p className="field-meta">
                  <span>Selected mood:</span>
                  <span
                    className="emotion-wheel-chip"
                    style={{ background: moodSpectrum[mood] }}
                  >
                    {formatLabel(mood)}
                  </span>
                </p>
                <div className="spectrum-control">
                  <span className="spectrum-heading">
                    <label htmlFor="expression-intensity">
                      Expression intensity
                    </label>
                    <output htmlFor="expression-intensity">
                      {formatLabel(expression)}
                    </output>
                  </span>
                  <input
                    id="expression-intensity"
                    type="range"
                    min="0"
                    max="2"
                    step="1"
                    value={intensity}
                    aria-valuetext={formatLabel(expression)}
                    onChange={(event) =>
                      setIntensity(Number(event.currentTarget.value))
                    }
                  />
                  <span className="spectrum-stops" aria-hidden="true">
                    {expressionLevels.map((level) => (
                      <span key={level}>{formatLabel(level)}</span>
                    ))}
                  </span>
                </div>
              </fieldset>

              <ChoiceControl
                label="Eye shape"
                name="eye-shape"
                value={shape}
                options={eyeShapes}
                preview="eye"
                onChange={setShape}
              />

              <div className="control-grid control-wide">
                <label className="control-field">
                  <span>Thought locale</span>
                  <input
                    value={locale}
                    maxLength={64}
                    list="thought-locales"
                    spellCheck="false"
                    onChange={(event) => setLocale(event.target.value)}
                  />
                  <datalist id="thought-locales">
                    {localeOptions.map((option) => (
                      <option
                        value={option}
                        label={
                          catalogWithFallbacks[option]?.label ??
                          languageNames.of(option) ??
                          option
                        }
                        lang={option === "und" ? undefined : option}
                        dir="auto"
                        key={option}
                      />
                    ))}
                  </datalist>
                  <small>
                    Try en-AU, ar-EG, zh-CN or mi-NZ →{" "}
                    <span lang={thoughtLanguage} dir="auto">
                      {displayLocaleContent.label}
                    </span>
                  </small>
                </label>
                <SelectControl
                  label="Atmosphere"
                  value={theme}
                  options={themeOptions}
                  onChange={setTheme}
                />
                <SelectControl
                  label="Eye art"
                  value={eyeStyle}
                  options={eyeStyles}
                  onChange={setEyeStyle}
                />
                <SelectControl
                  label="Gaze behaviour"
                  value={gaze}
                  options={gazeBehaviors}
                  onChange={setGaze}
                />
                <SelectControl
                  label="Blink"
                  value={blink}
                  options={blinkBehaviors}
                  onChange={setBlink}
                />
              </div>

              <ChoiceControl
                label="Thought bubble"
                name="thought-bubble"
                value={bubble}
                options={thoughtBubbleStyles}
                preview="bubble"
                onChange={setBubble}
              />

              <fieldset className="choice-field control-wide">
                <legend>Mouth spectrum</legend>
                <p className="field-hint">
                  Move across the spectrum to pick a mouth expression.
                </p>
                <div className="mouth-spectrum">
                  <span className="spectrum-heading">
                    <label htmlFor="mouth-style">Mouth expression</label>
                    <output htmlFor="mouth-style">{formatLabel(mouth)}</output>
                  </span>
                  <input
                    id="mouth-style"
                    type="range"
                    min="0"
                    max={mouthStyles.length - 1}
                    step="1"
                    value={mouthStyles.indexOf(mouth)}
                    aria-valuetext={formatLabel(mouth)}
                    onChange={(event) =>
                      setMouth(mouthStyles[Number(event.currentTarget.value)]!)
                    }
                  />
                  <span className="spectrum-stops" aria-hidden="true">
                    {mouthStyles.map((option) => (
                      <span key={option}>{formatLabel(option)}</span>
                    ))}
                  </span>
                </div>
              </fieldset>

              <ChoiceControl
                label="Blush"
                name="blush"
                value={blush === true ? "on" : blush === false ? "off" : "auto"}
                options={["auto", "on", "off"] as const}
                onChange={(value) =>
                  setBlush(value === "auto" ? "auto" : value === "on")
                }
              />

              <p className="locale-note control-wide">
                Seer validates every phrase at build time. Any other BCP-47
                locale falls back through a compatible script and language,
                then suppresses the bubble—never inferring a national
                personality. Treat starter translations as examples until
                native speakers review them for your community.
              </p>

              <div className="toggle-row control-wide">
                <label>
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(event) => setReducedMotion(event.target.checked)}
                  />
                  <span>Reduced motion</span>
                </label>
              </div>
            </form>
          </div>
        </section>

        <section className="worlds section-block" id="worlds" aria-labelledby="worlds-title">
          <div className="worlds-copy">
            <p className="kicker">ORIGINAL WORLDS</p>
            <h2 id="worlds-title">Atmosphere without stereotypes.</h2>
            <p>
              Place-inspired palettes and imagination-first genres change the
              visual atmosphere—not what a culture is supposed to feel. Bring
              your own palette for a specific community, story or brand.
            </p>
          </div>
          <div className="preset-grid">
            {presets.map((preset) => (
              <button
                className="preset-card"
                type="button"
                key={preset.name}
                onClick={() => usePreset(preset)}
              >
                <span className="preset-face" aria-hidden="true">
                  <LivingText
                    text={preset.text}
                    eyeMarkers
                    mood={livingTextMoods.excited}
                    theme={preset.theme}
                    eyeShape={preset.shape}
                    eyeStyle={preset.eyeStyle}
                    gaze={preset.gaze}
                    bubbleStyle={preset.bubble}
                    blink="none"
                    reducedMotion
                    mouth="auto"
                    thoughts={{ excited: "" }}
                  />
                </span>
                <strong>{preset.name}</strong>
                <small>{preset.note}</small>
              </button>
            ))}
          </div>
        </section>

      </main>

      <footer className="site-footer">
        <span>Eyslie / expressive living text</span>
        <a href="https://www.npmjs.com/package/@uqrealitylabs/eyslie" rel="noreferrer">
          npm ↗
        </a>
        <a href="https://github.com/uqrealitylabs/eyslie" rel="noreferrer">
          Source ↗
        </a>
        <a href="./OFL.txt">Font licence</a>
      </footer>
    </div>
  );
}

type SelectControlProps<T extends string> = {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
};

function SelectControl<T extends string>({
  label,
  value,
  options,
  onChange,
}: SelectControlProps<T>) {
  return (
    <label className="control-field">
      <span>{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
      >
        {options.map((option) => (
          <option value={option} key={option}>
            {formatLabel(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

type ChoiceControlProps<T extends string> = SelectControlProps<T> & {
  name: string;
  preview?: "eye" | "bubble" | undefined;
};

function ChoiceControl<T extends string>({
  label,
  name,
  value,
  options,
  preview,
  onChange,
}: ChoiceControlProps<T>) {
  return (
    <fieldset className="choice-field control-wide">
      <legend>{label}</legend>
      <div className="choice-options">
        {options.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              onChange={() => onChange(option)}
            />
            <span className="choice-card">
              {preview ? (
                <span
                  className="choice-preview"
                  data-preview={preview}
                  data-option={option}
                  aria-hidden="true"
                />
              ) : null}
              <span>{formatLabel(option)}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

createRoot(document.getElementById("root")!).render(<App />);
