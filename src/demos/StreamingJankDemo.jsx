import { useState, useEffect, useRef } from 'react';
import { prepare, layout } from '@chenglou/pretext';

const SAMPLE_TEXT = `The fundamental problem with CSS text measurement is that it was designed for documents, not dynamic user interfaces. When you need to know how tall a paragraph will be before rendering it, CSS offers no solution. You must render first, measure second, then adjust. This creates a cascade of layout recalculations that become visible as jank, especially on mobile devices or when content is streaming in real-time.`;

function StreamingJankDemo() {
  const [mode, setMode] = useState('idle'); // idle, css, pretext
  const [cssText, setCssText] = useState('');
  const [pretextText, setPretextText] = useState('');
  const [cssHeight, setCssHeight] = useState('auto');
  const [pretextHeight, setPretextHeight] = useState(0);
  const cssRef = useRef(null);
  const cssReflowCount = useRef(0);
  const pretextReflowCount = useRef(0);

  const startCSSStreaming = () => {
    setMode('css');
    setCssText('');
    cssReflowCount.current = 0;

    let index = 0;
    const interval = setInterval(() => {
      if (index >= SAMPLE_TEXT.length) {
        clearInterval(interval);
        setMode('idle');
        return;
      }

      setCssText(prev => prev + SAMPLE_TEXT[index]);
      // Each update causes a reflow when the browser measures the new height
      cssReflowCount.current++;
      index++;
    }, 20);
  };

  const startPretextStreaming = () => {
    setMode('pretext');
    setPretextText('');
    pretextReflowCount.current = 0;

    // Pre-calculate the final height
    const font = '16px Inter, sans-serif';
    const maxWidth = 400;
    const lineHeight = 24;
    const prepared = prepare(SAMPLE_TEXT, font);
    const { height } = layout(prepared, maxWidth, lineHeight);

    // Set height ONCE, before streaming starts
    setPretextHeight(height);
    pretextReflowCount.current = 1; // Only one layout calculation!

    let index = 0;
    const interval = setInterval(() => {
      if (index >= SAMPLE_TEXT.length) {
        clearInterval(interval);
        setMode('idle');
        return;
      }

      setPretextText(prev => prev + SAMPLE_TEXT[index]);
      // No reflow! Height is already set
      index++;
    }, 20);
  };

  return (
    <div className="demo-section">
      <h2>Problem 2: Streaming Content Jank</h2>
      <p className="demo-description">
        Watch how the containers behave as text streams in character-by-character.
        CSS recalculates on every character. Pretext calculates once.
      </p>

      <div className="controls">
        <button onClick={startCSSStreaming} disabled={mode !== 'idle'}>
          Stream with CSS (Janky)
        </button>
        <button onClick={startPretextStreaming} disabled={mode !== 'idle'}>
          Stream with Pretext (Smooth)
        </button>
      </div>

      <div className="streaming-comparison">
        <div className="streaming-panel">
          <h3>CSS Approach</h3>
          <div className="stream-container css" ref={cssRef}>
            {cssText}
          </div>
          <div className="stats">
            Layout calculations: <strong>{cssReflowCount.current}</strong>
          </div>
          <p className="note">
            Height is <code>auto</code> - browser recalculates every frame
          </p>
        </div>

        <div className="streaming-panel">
          <h3>Pretext Approach</h3>
          <div
            className="stream-container pretext"
            style={{ height: pretextHeight > 0 ? `${pretextHeight}px` : 'auto' }}
          >
            {pretextText}
          </div>
          <div className="stats">
            Layout calculations: <strong>{pretextReflowCount.current}</strong>
          </div>
          <p className="note">
            Height set to <code>{pretextHeight}px</code> before streaming
          </p>
        </div>
      </div>

      <div className="explanation-box">
        <h4>What's happening?</h4>
        <ul>
          <li><strong>CSS:</strong> Each character triggers a height recalculation. The browser doesn't know the final size. {SAMPLE_TEXT.length} characters = {SAMPLE_TEXT.length} reflows.</li>
          <li><strong>Pretext:</strong> Calculates final height before streaming. Container size is fixed. 1 calculation total.</li>
          <li><strong>Why it matters:</strong> ChatGPT-style interfaces, live captions, any streaming text content.</li>
        </ul>
      </div>
    </div>
  );
}

export default StreamingJankDemo;
