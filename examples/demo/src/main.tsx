import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LivingText,
  livingTextEmotionNames,
  livingTextEyeStyles,
  livingTextMoods,
  type AffectVector,
  type LivingTextEmotionName,
  type LivingTextEyeStyle,
  type LivingTextMood,
} from "../../../dist/index.js";
import "@uqrealitylabs/eyslie/styles.css";
import "./styles.css";

const DEFAULT_AFFECT: AffectVector = {
  valence: 0.75,
  arousal: 0.7,
  dominance: 0.2,
  intensity: 0.8,
};

const moodOptions: LivingTextMood[] = Object.values(livingTextMoods);
const affectControls: Array<{ key: keyof AffectVector; label: string; min: number; max: number; step: number }> = [
  { key: "valence", label: "Valence", min: -1, max: 1, step: 0.05 },
  { key: "arousal", label: "Arousal", min: 0, max: 1, step: 0.05 },
  { key: "dominance", label: "Dominance", min: -1, max: 1, step: 0.05 },
  { key: "intensity", label: "Intensity", min: 0, max: 1, step: 0.05 },
];

const defaultCode = `<LivingText
  text="JOIN US"
  emotion="joy"
  eyeLetters={{ primary: "O", secondary: "U" }}
  reducedMotion={prefersReducedMotion}
/>`;

function clampText(text: string) {
  return text.slice(0, 24);
}

function App() {
  const [text, setText] = useState("JOIN US");
  const [emotionInput, setEmotionInput] = useState<LivingTextEmotionName>("joy");
  const [mood, setMood] = useState<LivingTextMood>(livingTextMoods.idleCurious);
  const [eyeStyle, setEyeStyle] = useState<LivingTextEyeStyle>("cartoon");
  const [affect, setAffect] = useState<AffectVector>(DEFAULT_AFFECT);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [ready, setReady] = useState(true);
  const [copyStatus, setCopyStatus] = useState("Copy example");

  const validEmotion = livingTextEmotionNames.includes(emotionInput);
  const emotion = validEmotion ? emotionInput : "neutral";

  function reset() {
    setText("JOIN US");
    setEmotionInput("joy");
    setMood(livingTextMoods.idleCurious);
    setEyeStyle("cartoon");
    setAffect(DEFAULT_AFFECT);
    setReducedMotion(false);
    setReady(true);
    setCopyStatus("Copy example");
  }

  async function copyExample() {
    if (!navigator.clipboard) {
      setCopyStatus("Clipboard unavailable");
      return;
    }
    await navigator.clipboard.writeText(defaultCode);
    setCopyStatus("Copied");
    window.setTimeout(() => setCopyStatus("Copy example"), 1600);
  }

  return (
    <div className="demo-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Eyslie home">
          <span className="brand-mark" aria-hidden="true">◎</span>
          <span>UQ Reality Labs / Eyslie</span>
        </a>
        <nav aria-label="Primary navigation">
          <a href="#playground">Playground</a>
          <a href="#how-it-works">How it works</a>
          <a href="https://github.com/uqrealitylabs/eyslie" rel="noreferrer">GitHub</a>
        </nav>
      </header>

      <main id="top">
        <section className="hero section-grid">
          <div className="hero-copy">
            <p className="eyebrow">REACT / LIVING TEXT / ANCHORED EYES</p>
            <h1>Eyslie</h1>
            <p className="hero-lede">Letters that notice, blink, blush, and answer back.</p>
            <p className="hero-body">
              A small React package for expressive words and short labels. Keep the text readable, then add eye geometry and mood as a layer.
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#playground">Try the letters</a>
              <a className="button button-quiet" href="#install">Install package</a>
            </div>
          </div>
          <div className="hero-note" aria-label="Eyslie design note">
            <span className="note-line">O keeps its glyph.</span>
            <span className="note-line">U owns the wink.</span>
            <span className="note-line">No eyebrow required.</span>
          </div>
        </section>

        <section className="playground section-block" id="playground" aria-labelledby="playground-title">
          <div className="section-heading">
            <p className="eyebrow">LIVE PLAYGROUND</p>
            <h2 id="playground-title">Give a word a point of view.</h2>
            <p>Change the public component inputs and watch the actual package respond.</p>
          </div>
          <div className="playground-layout">
            <div className="living-stage">
              <div className="stage-label">Rendered with <code>LivingText</code></div>
              <div className="living-word" data-testid="living-text-demo">
                <LivingText
                  text={text || " "}
                  ariaLabel={text || "Living text"}
                  mood={mood}
                  emotion={emotion}
                  affect={affect}
                  eyeStyle={eyeStyle}
                  eyeLetters={{ primary: "O", secondary: "U" }}
                  thoughts={{ nearStartled: "AWWWW", celebration: "yay", sadShrivel: "aw." }}
                  reducedMotion={reducedMotion}
                  ready={ready}
                  siteReady
                  testMode
                />
              </div>
              <p className="stage-status" role="status">
                {ready ? "Plain text is ready; overlays are measured before they appear." : "Readiness is paused; the readable text stays in place."}
              </p>
              {!validEmotion && <p className="field-error">Choose an emotion from the list to activate its preset.</p>}
            </div>

            <form className="control-panel" onSubmit={(event) => event.preventDefault()}>
              <div className="control-panel-heading">
                <div>
                  <p className="eyebrow">PUBLIC PROPS</p>
                  <h3>Shape the response</h3>
                </div>
                <button className="text-button" type="button" onClick={reset}>Reset</button>
              </div>

              <label className="control-field">
                <span>Text</span>
                <input value={text} maxLength={24} onChange={(event) => setText(clampText(event.target.value))} />
              </label>
              <label className="control-field">
                <span>Emotion preset</span>
                <input
                  list="emotion-options"
                  value={emotionInput}
                  onChange={(event) => setEmotionInput(event.target.value as LivingTextEmotionName)}
                  aria-describedby="emotion-help"
                />
                <datalist id="emotion-options">
                  {livingTextEmotionNames.map((name) => <option value={name} key={name} />)}
                </datalist>
                <small id="emotion-help">38 named presets, plus custom affect vectors.</small>
              </label>
              <label className="control-field">
                <span>Mood state</span>
                <select value={mood} onChange={(event) => setMood(event.target.value as LivingTextMood)}>
                  {moodOptions.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
              <label className="control-field">
                <span>Eye style</span>
                <select value={eyeStyle} onChange={(event) => setEyeStyle(event.target.value as LivingTextEyeStyle)}>
                  {livingTextEyeStyles.map((style) => <option value={style} key={style}>{style}</option>)}
                </select>
              </label>
              <div className="range-list" aria-label="Affect controls">
                {affectControls.map(({ key, label, min, max, step }) => (
                  <label className="range-field" key={key}>
                    <span><span>{label}</span><output>{affect[key].toFixed(2)}</output></span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={affect[key]}
                      onChange={(event) => setAffect((current) => ({ ...current, [key]: Number(event.target.value) }))}
                    />
                  </label>
                ))}
              </div>
              <label className="check-field"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /><span>Reduced motion</span></label>
              <label className="check-field"><input type="checkbox" checked={ready} onChange={(event) => setReady(event.target.checked)} /><span>Site ready signal</span></label>
            </form>
          </div>
        </section>

        <section className="feature-section section-block" id="how-it-works" aria-labelledby="features-title">
          <div className="section-heading">
            <p className="eyebrow">SMALL API / USEFUL BOUNDARIES</p>
            <h2 id="features-title">The playful bits stay composable.</h2>
          </div>
          <div className="feature-grid">
            <article className="feature-item"><span className="feature-number">01</span><h3>Anchored eyes</h3><p>O and U anchors are explicit and recalculated from local letter bounds, so overlays do not jump to the page corner.</p></article>
            <article className="feature-item"><span className="feature-number">02</span><h3>Emotion as parameters</h3><p>Named moods are a friendly start. Valence, arousal, dominance, and intensity let a site tune the feel.</p></article>
            <article className="feature-item"><span className="feature-number">03</span><h3>Readable by default</h3><p>Plain text renders first, animated layers wait for layout, and reduced motion keeps the expression legible.</p></article>
            <article className="feature-item"><span className="feature-number">04</span><h3>Thought bubbles</h3><p>Small reactions such as AWWWW, aw., ow., and yay are configurable site copy, not hard-coded navigation.</p></article>
          </div>
        </section>

        <section className="code-section section-block" aria-labelledby="code-title">
          <div className="section-heading"><p className="eyebrow">START SMALL</p><h2 id="code-title">One component, a few deliberate props.</h2></div>
          <div className="code-panel">
            <div className="code-panel-heading"><span>join-us.tsx</span><button className="text-button" type="button" onClick={copyExample}>{copyStatus}</button></div>
            <pre><code>{defaultCode}</code></pre>
          </div>
        </section>

        <section className="install-section section-block" id="install" aria-labelledby="install-title">
          <div><p className="eyebrow">READY WHEN YOU ARE</p><h2 id="install-title">Install the living layer.</h2><p>React is the only runtime peer. CSS is an explicit public export.</p></div>
          <code className="install-command">npm install @uqrealitylabs/eyslie</code>
        </section>
      </main>

      <footer className="site-footer"><span>Eyslie / interactive library demonstration</span><span>UQ Reality Labs</span><a href="https://github.com/uqrealitylabs/eyslie" rel="noreferrer">Source on GitHub</a></footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
