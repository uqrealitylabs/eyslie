import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  LivingText,
  livingTextMoods,
  type LivingTextMood,
} from "../../../dist/index.js";
import "@uqrealitylabs/eyslie/styles.css";
import "./styles.css";

const moodOptions: LivingTextMood[] = Object.values(livingTextMoods);

const defaultCode = `<LivingText
  text="JOIN US"
  mood={livingTextMoods.idleCurious}
  eyeLetters={{ primary: "O", secondary: "U" }}
/>`;

function App() {
  const [text, setText] = useState("JOIN US");
  const [mood, setMood] = useState<LivingTextMood>(livingTextMoods.idleCurious);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [copyStatus, setCopyStatus] = useState("Copy example");

  function reset() {
    setText("JOIN US");
    setMood(livingTextMoods.idleCurious);
    setReducedMotion(false);
    setCopyStatus("Copy example");
  }

  async function copyExample() {
    if (!navigator.clipboard) {
      setCopyStatus("Clipboard unavailable");
      return;
    }
    try {
      await navigator.clipboard.writeText(defaultCode);
      setCopyStatus("Copied");
      window.setTimeout(() => setCopyStatus("Copy example"), 1600);
    } catch {
      setCopyStatus("Copy failed");
    }
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
                  eyeLetters={{ primary: "O", secondary: "U" }}
                  thoughts={{ nearStartled: "AWWWW", celebration: "yay", sadShrivel: "aw." }}
                  reducedMotion={reducedMotion}
                />
              </div>
              <p className="stage-status">
                Move the pointer around the word to aim the pupils; the U blinks on its seeded schedule.
              </p>
            </div>

            <div className="control-panel">
              <div className="control-panel-heading">
                <div>
                  <p className="eyebrow">PUBLIC PROPS</p>
                  <h3>Shape the response</h3>
                </div>
                <button className="text-button" type="button" onClick={reset}>Reset</button>
              </div>

              <label className="control-field">
                <span>Text</span>
                <input value={text} maxLength={24} onChange={(event) => setText(event.target.value)} />
              </label>
              <label className="control-field">
                <span>Mood state</span>
                <select value={mood} onChange={(event) => setMood(event.target.value as LivingTextMood)}>
                  {moodOptions.map((option) => <option value={option} key={option}>{option}</option>)}
                </select>
              </label>
              <label className="check-field"><input type="checkbox" checked={reducedMotion} onChange={(event) => setReducedMotion(event.target.checked)} /><span>Reduced motion</span></label>
            </div>
          </div>
        </section>

        <section className="feature-section section-block" id="how-it-works" aria-labelledby="features-title">
          <div className="section-heading">
            <p className="eyebrow">SMALL API / USEFUL BOUNDARIES</p>
            <h2 id="features-title">The playful bits stay composable.</h2>
          </div>
          <div className="feature-grid">
            <article className="feature-item"><span className="feature-number">01</span><h3>Anchored eyes</h3><p>O and U anchors are explicit and recalculated from local letter bounds, so overlays do not jump to the page corner.</p></article>
            <article className="feature-item"><span className="feature-number">02</span><h3>Explicit moods</h3><p>Named states control colour, blush, and thought bubbles without hiding application logic inside the component.</p></article>
            <article className="feature-item"><span className="feature-number">03</span><h3>Readable by default</h3><p>Server and client render the same accessible text, and reduced motion keeps the expression still.</p></article>
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

      <footer className="site-footer"><span>Eyslie / interactive library demonstration</span><span>UQ Reality Labs</span><a href="https://github.com/uqrealitylabs/eyslie" rel="noreferrer">Source on GitHub</a><a href="./OFL.txt">Font licence</a></footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
