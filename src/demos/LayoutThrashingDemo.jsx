import { useState } from 'react';
import { prepare, layout } from '@chenglou/pretext';

const generateMessages = (count) => {
  const templates = [
    "Hey there!",
    "This is a longer message that will wrap to multiple lines and show the performance difference",
    "Short msg",
    "The quick brown fox jumps over the lazy dog and then some more text to make it interesting",
    "Just checking in to see how you're doing today! Hope everything is going well 😊",
  ];

  return Array.from({ length: count }, (_, i) =>
    templates[i % templates.length] + ` #${i}`
  );
};

function LayoutThrashingDemo() {
  const [messageCount, setMessageCount] = useState(500);
  const [cssTime, setCssTime] = useState(null);
  const [pretextTime, setPretextTime] = useState(null);
  const [running, setRunning] = useState(false);

  const measureWithCSS = () => {
    const messages = generateMessages(messageCount);
    const start = performance.now();

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.visibility = 'hidden';
    container.style.maxWidth = '320px';
    container.style.font = '16px Inter, sans-serif';
    container.style.lineHeight = '24px';
    container.style.padding = '8px 12px';
    document.body.appendChild(container);

    const heights = messages.map(msg => {
      container.textContent = msg;
      // This forces a reflow! The browser has to recalculate layout
      const height = container.offsetHeight;
      return height;
    });

    document.body.removeChild(container);
    const end = performance.now();

    return end - start;
  };

  const measureWithPretext = () => {
    const messages = generateMessages(messageCount);
    const start = performance.now();

    const font = '16px Inter, sans-serif';
    const maxWidth = 320;
    const lineHeight = 24;

    const heights = messages.map(msg => {
      const prepared = prepare(msg, font);
      const { height } = layout(prepared, maxWidth, lineHeight);
      return height;
    });

    const end = performance.now();
    return end - start;
  };

  const runBenchmark = async () => {
    setRunning(true);
    setCssTime(null);
    setPretextTime(null);

    // Let UI update
    await new Promise(resolve => setTimeout(resolve, 100));

    const cssResult = measureWithCSS();
    setCssTime(cssResult);

    await new Promise(resolve => setTimeout(resolve, 100));

    const pretextResult = measureWithPretext();
    setPretextTime(pretextResult);

    setRunning(false);
  };

  const speedup = cssTime && pretextTime ? (cssTime / pretextTime).toFixed(1) : null;

  return (
    <div className="demo-section">
      <h2>Problem 1: Layout Thrashing</h2>
      <p className="demo-description">
        Measuring {messageCount} messages. CSS forces the browser to recalculate
        layout for each measurement. Pretext uses pure math.
      </p>

      <div className="controls">
        <label>
          Message count:
          <input
            type="range"
            min="100"
            max="2000"
            step="100"
            value={messageCount}
            onChange={(e) => setMessageCount(Number(e.target.value))}
            disabled={running}
          />
          <span>{messageCount}</span>
        </label>
      </div>

      <button
        onClick={runBenchmark}
        disabled={running}
        className="benchmark-button"
      >
        {running ? 'Running...' : 'Run Benchmark'}
      </button>

      {(cssTime || pretextTime) && (
        <div className="results">
          <div className="result-row">
            <span className="label">CSS (render-then-measure):</span>
            <span className="value css">{cssTime?.toFixed(2)}ms</span>
          </div>
          <div className="result-row">
            <span className="label">Pretext (measure-then-render):</span>
            <span className="value pretext">{pretextTime?.toFixed(2)}ms</span>
          </div>
          {speedup && (
            <div className="result-row speedup">
              <span className="label">Speedup:</span>
              <span className="value">{speedup}x faster</span>
            </div>
          )}
        </div>
      )}

      <div className="explanation-box">
        <h4>What's happening?</h4>
        <ul>
          <li><strong>CSS approach:</strong> Creates a hidden div, adds text, calls <code>offsetHeight</code> (forces reflow), removes div. Repeat {messageCount} times.</li>
          <li><strong>Pretext approach:</strong> Calls <code>prepare()</code> and <code>layout()</code> with pure math. No DOM manipulation.</li>
          <li><strong>Why it matters:</strong> Virtual scrolling, feed rendering, anything that needs heights before rendering.</li>
        </ul>
      </div>
    </div>
  );
}

export default LayoutThrashingDemo;
