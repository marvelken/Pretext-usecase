import { useState, useEffect, useRef } from 'react';
import { prepareWithSegments, layout } from '@chenglou/pretext';

const STREAMING_RESPONSE = `Sure! Pretext is a TypeScript library by Cheng Lou that measures multiline text without touching the DOM. It uses Canvas measureText under the hood and runs pure arithmetic for layout. The result is text measurement that's roughly 300x faster than getBoundingClientRect, with full support for emoji, CJK characters, and bidirectional text. It's the kind of thing that unlocks a whole category of UI patterns that were previously impossible without jank.`;

const FONT = '15px -apple-system, system-ui, sans-serif';
const MAX_WIDTH = 320;
const LINE_HEIGHT = 22;
const TOKEN_INTERVAL_MS = 60;
const RESET_DELAY_MS = 2000;

function usePretextWidth(text) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (!text) {
      setWidth(0);
      return;
    }

    const prepared = prepareWithSegments(text, FONT);

    // Get target line count at max width
    const { lineCount: targetLines } = layout(prepared, MAX_WIDTH, LINE_HEIGHT);

    // Binary search for tightest width that keeps the same line count
    let lo = 0;
    let hi = MAX_WIDTH;
    while (hi - lo > 1) {
      const mid = (lo + hi) / 2;
      const { lineCount } = layout(prepared, mid, LINE_HEIGHT);
      if (lineCount <= targetLines) hi = mid;
      else lo = mid;
    }

    setWidth(Math.ceil(hi));
  }, [text]);

  return width;
}

function StreamingBubble({ text, isStreaming, usePretext, onLayoutShift }) {
  const bubbleRef = useRef(null);
  const pretextWidth = usePretextWidth(text);

  // Track layout shifts using ResizeObserver
  useEffect(() => {
    if (!bubbleRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Get the content box height
        const height = entry.contentBoxSize
          ? entry.contentBoxSize[0]?.blockSize
          : entry.contentRect.height;

        if (height > 0) {
          onLayoutShift(height);
        }
      }
    });

    resizeObserver.observe(bubbleRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [onLayoutShift]);

  const bubbleStyle = usePretext
    ? {
        width: pretextWidth > 0 ? `${pretextWidth}px` : 'auto',
        minWidth: '40px',
      }
    : {
        maxWidth: `${MAX_WIDTH}px`,
      };

  return (
    <div
      ref={bubbleRef}
      className={`bubble ${usePretext ? 'pretext' : 'naive'}`}
      style={bubbleStyle}
    >
      {text}
      {isStreaming && <span className="cursor">▍</span>}
    </div>
  );
}

function StreamingDemo({ onBack }) {
  const [currentTokenIndex, setCurrentTokenIndex] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [naiveHeight, setNaiveHeight] = useState(0);
  const [pretextHeight, setPretextHeight] = useState(0);
  const [naiveShifts, setNaiveShifts] = useState(0);
  const [pretextShifts, setPretextShifts] = useState(0);

  const prevNaiveHeightRef = useRef(0);
  const prevPretextHeightRef = useRef(0);

  const tokens = STREAMING_RESPONSE.split(' ');
  const displayText = tokens.slice(0, currentTokenIndex).join(' ');

  const handleNaiveLayoutShift = (height) => {
    const roundedHeight = Math.round(height);
    setNaiveHeight(roundedHeight);

    if (prevNaiveHeightRef.current > 0 && prevNaiveHeightRef.current !== roundedHeight) {
      setNaiveShifts((prev) => prev + 1);
    }
    prevNaiveHeightRef.current = roundedHeight;
  };

  const handlePretextLayoutShift = (height) => {
    const roundedHeight = Math.round(height);
    setPretextHeight(roundedHeight);

    if (prevPretextHeightRef.current > 0 && prevPretextHeightRef.current !== roundedHeight) {
      setPretextShifts((prev) => prev + 1);
    }
    prevPretextHeightRef.current = roundedHeight;
  };

  const restartStream = () => {
    setCurrentTokenIndex(0);
    setNaiveHeight(0);
    setPretextHeight(0);
    setNaiveShifts(0);
    setPretextShifts(0);
    prevNaiveHeightRef.current = 0;
    prevPretextHeightRef.current = 0;
    setIsStreaming(true);
  };

  useEffect(() => {
    // Auto-start on mount
    setIsStreaming(true);
  }, []);

  useEffect(() => {
    if (!isStreaming) return;

    if (currentTokenIndex < tokens.length) {
      const timer = setTimeout(() => {
        setCurrentTokenIndex((prev) => prev + 1);
      }, TOKEN_INTERVAL_MS);
      return () => clearTimeout(timer);
    } else {
      // Stream complete, wait and restart
      setIsStreaming(false);
      const resetTimer = setTimeout(() => {
        restartStream();
      }, RESET_DELAY_MS);
      return () => clearTimeout(resetTimer);
    }
  }, [currentTokenIndex, isStreaming, tokens.length]);

  return (
    <div className="app">
      <button onClick={onBack} className="back-button">← Back to demos</button>

      <header>
        <h1>Streaming AI Chat Jitter Fix</h1>
        <p>Watch how naive streaming jumps around vs Pretext's smooth growth</p>
      </header>

      <div className="comparison-container">
        <div className="bubble-section">
          <div className="section-header">
            <span className="label naive-label">❌ Naive</span>
          </div>
          <div className="stats">
            <span className="stat">Height: {naiveHeight}px</span>
            <span className="stat">Layout shifts: {naiveShifts}</span>
          </div>
          <StreamingBubble
            text={displayText}
            isStreaming={isStreaming && currentTokenIndex < tokens.length}
            usePretext={false}
            onLayoutShift={handleNaiveLayoutShift}
          />
        </div>

        <div className="bubble-section">
          <div className="section-header">
            <span className="label pretext-label">✓ Pretext</span>
          </div>
          <div className="stats">
            <span className="stat">Height: {pretextHeight}px <span className="predicted">(predicted)</span></span>
            <span className="stat">Layout shifts: {pretextShifts}</span>
          </div>
          <StreamingBubble
            text={displayText}
            isStreaming={isStreaming && currentTokenIndex < tokens.length}
            usePretext={true}
            onLayoutShift={handlePretextLayoutShift}
          />
        </div>
      </div>

      <div className="summary">
        Naive layout shifts: <strong>{naiveShifts}</strong> | Pretext layout shifts: <strong>{pretextShifts}</strong>
      </div>

      <button onClick={restartStream} className="restart-button">
        Restart stream
      </button>

      <footer>
        <p>
          <strong>What you're seeing:</strong> The naive bubble lets the browser calculate layout naturally,
          causing many layout shifts as text wraps during streaming. Pretext pre-computes both width and height
          before rendering, reserving the exact space needed — resulting in far fewer layout shifts.
        </p>
      </footer>
    </div>
  );
}

export default StreamingDemo;
