import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  blinkBehaviors,
  expressionLevels,
  eyeShapes,
  eyeStyles,
  gazeBehaviors,
  LivingText,
  type BlinkBehavior,
  type ExpressionLevel,
  type EyeShape,
  type EyeStyle,
  type GazeBehavior,
  type LivingTextMood,
  type LivingTextTheme,
  livingTextMoods,
  livingTextThemes,
  type ThoughtBubbleStyle,
  thoughtBubbleStyles,
} from "../../../dist/index.js";
import "@uqrealitylabs/eyslie/styles.css";
import "./styles.css";

const moodOptions: LivingTextMood[] = Object.values(livingTextMoods);
const themeOptions = Object.keys(livingTextThemes) as LivingTextTheme[];
const demoThoughts: Partial<Record<LivingTextMood, string>> = {
  nearStartled: "whoa!",
  excited: "yes!",
  blush: "oh—hi",
  celebration: "we did it!",
  sadShrivel: "ouch…",
  recovery: "okay.",
};

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
  const [expression, setExpression] =
    useState<ExpressionLevel>("theatrical");
  const [bubble, setBubble] = useState<ThoughtBubbleStyle>("comic");
  const [smile, setSmile] = useState(true);
  const [blush, setBlush] = useState<boolean | "auto">("auto");
  const [reducedMotion, setReducedMotion] = useState(false);

  function reset() {
    setText("W^O>W!");
    setMood(livingTextMoods.excited);
    setTheme("retroArcade");
    setShape("star");
    setEyeStyle("cosmic");
    setGaze("follow");
    setBlink("wink");
    setExpression("theatrical");
    setBubble("comic");
    setSmile(true);
    setBlush("auto");
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
    <div className="demo-shell">
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
              smile
              thoughts={{ celebration: "hello!" }}
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
              Move your pointer around the stage, then mix shape, motion, mood,
              art and atmosphere. Every control below is a real public prop.
            </p>
          </div>

          <div className="lab-layout">
            <div
              className="living-stage"
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
                <span className="live-dot">● running</span>
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
                    thoughts={demoThoughts}
                    smile={smile}
                    blush={blush}
                    reducedMotion={reducedMotion}
                  />
                </div>
              </div>
              <p className="stage-status" aria-live="polite">
                {formatLabel(mood)} · {formatLabel(theme)} · {formatLabel(shape)}
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
                <small>Try C^O&gt;O&lt;L or put an eye on emoji.</small>
              </label>

              <fieldset className="mood-field control-wide">
                <legend>Mood</legend>
                <div className="mood-options">
                  {moodOptions.map((option) => (
                    <label key={option}>
                      <input
                        type="radio"
                        name="mood"
                        value={option}
                        checked={mood === option}
                        onChange={() => setMood(option)}
                      />
                      <span>{formatLabel(option)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="control-grid control-wide">
                <SelectControl
                  label="Atmosphere"
                  value={theme}
                  options={themeOptions}
                  onChange={setTheme}
                />
                <SelectControl
                  label="Eye shape"
                  value={shape}
                  options={eyeShapes}
                  onChange={setShape}
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
                <SelectControl
                  label="Expression"
                  value={expression}
                  options={expressionLevels}
                  onChange={setExpression}
                />
                <SelectControl
                  label="Thought bubble"
                  value={bubble}
                  options={thoughtBubbleStyles}
                  onChange={setBubble}
                />
                <SelectControl
                  label="Blush"
                  value={blush === true ? "on" : blush === false ? "off" : "auto"}
                  options={["auto", "on", "off"] as const}
                  onChange={(value) =>
                    setBlush(value === "auto" ? "auto" : value === "on")
                  }
                />
              </div>

              <div className="toggle-row control-wide">
                <label>
                  <input
                    type="checkbox"
                    checked={smile}
                    onChange={(event) => setSmile(event.target.checked)}
                  />
                  <span>Smile</span>
                </label>
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
                    smile
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

function formatLabel(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (letter) => letter.toUpperCase());
}

createRoot(document.getElementById("root")!).render(<App />);
