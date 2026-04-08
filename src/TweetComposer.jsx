import { useState, useMemo } from 'react';
import { prepareWithSegments, layout, walkLineRanges } from '@chenglou/pretext';

const FONT = '15px -apple-system, system-ui, sans-serif';
const LINE_HEIGHT = 22;
const MIN_WIDTH = 280;
const MAX_WIDTH = 550;
const MAX_CHARS = 280;

const SAMPLE_TWEETS = [
  "just shipped",
  "Pretext is wild. You can measure text dimensions without touching the DOM. The whole library is 5KB and 300x faster than getBoundingClientRect.",
  "hot take: most performance problems in modern frontend aren't about re-renders, they're about layout thrashing and the profiler doesn't surface it well 🤔",
  "Spent 3 hours debugging a CSS issue. Turns out my max-width was overriding my width: fit-content. As one does.",
  "If you build a chat app and you don't pre-compute message heights, your virtualization is lying to your users every time they scroll. Sorry not sorry.",
];

function findOptimalWidth(text) {
  if (!text.trim()) return { width: MIN_WIDTH, wastedPixelsAtMaxWidth: 0, lineCount: 0 };

  const prepared = prepareWithSegments(text, FONT);

  // Get line count at max width
  const { lineCount: targetLines } = layout(prepared, MAX_WIDTH, LINE_HEIGHT);

  // Find longest line at max width using walkLineRanges
  let longestLineAtMax = 0;
  walkLineRanges(prepared, MAX_WIDTH, (line) => {
    if (line.width > longestLineAtMax) longestLineAtMax = line.width;
  });
  const wastedPixelsAtMaxWidth = MAX_WIDTH - Math.ceil(longestLineAtMax);

  // Binary search for tightest width that keeps same line count
  let lo = MIN_WIDTH;
  let hi = MAX_WIDTH;
  while (hi - lo > 1) {
    const mid = (lo + hi) / 2;
    const { lineCount } = layout(prepared, mid, LINE_HEIGHT);
    if (lineCount <= targetLines) hi = mid;
    else lo = mid;
  }

  return {
    width: Math.ceil(hi),
    wastedPixelsAtMaxWidth,
    lineCount: targetLines,
  };
}

function TweetCard({ text, width, showWasted = false, label }) {
  const prepared = useMemo(() => {
    if (!text.trim()) return null;
    return prepareWithSegments(text, FONT);
  }, [text]);

  const lineWidths = useMemo(() => {
    if (!prepared) return [];
    const widths = [];
    walkLineRanges(prepared, width, (line) => {
      widths.push(Math.ceil(line.width));
    });
    return widths;
  }, [prepared, width]);

  const hasWastedSpace = showWasted && lineWidths.some((w) => width - w > 50);

  return (
    <div className="tweet-card-container">
      <div className="card-label">{label}</div>
      <div className="tweet-card" style={{ width: `${width}px` }}>
        <div className="tweet-header">
          <div className="tweet-avatar">P</div>
          <div className="tweet-meta">
            <div className="tweet-author">
              <span className="display-name">Pretext Demo</span>
              <span className="handle">@pretext</span>
              <span className="time">· 2m</span>
            </div>
          </div>
        </div>
        <div
          className={`tweet-text ${hasWastedSpace ? 'show-wasted' : ''}`}
          style={{
            fontFamily: '-apple-system, system-ui, sans-serif',
            fontSize: '15px',
            lineHeight: '22px',
          }}
        >
          {text || 'What\'s on your mind?'}
        </div>
      </div>
    </div>
  );
}

function TweetComposer({ onBack }) {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [text, setText] = useState(SAMPLE_TWEETS[1]);

  const { width: optimalWidth, wastedPixelsAtMaxWidth, lineCount } = useMemo(
    () => findOptimalWidth(text),
    [text]
  );

  const pixelsSaved = MAX_WIDTH - optimalWidth;
  const percentSaved = Math.round((pixelsSaved / MAX_WIDTH) * 100);

  const handleTryAnother = () => {
    const nextIndex = (currentIndex + 1) % SAMPLE_TWEETS.length;
    setCurrentIndex(nextIndex);
    setText(SAMPLE_TWEETS[nextIndex]);
  };

  const handleTextChange = (e) => {
    const newText = e.target.value;
    if (newText.length <= MAX_CHARS) {
      setText(newText);
    }
  };

  return (
    <div className="tweet-composer">
      <div className="composer-header">
        <button onClick={onBack} className="back-button-tweet">
          ← Back
        </button>
        <h1>Smart Tweet Composer</h1>
        <p className="composer-subtitle">
          Watch the card width auto-adjust for perfect visual balance
        </p>
      </div>

      <div className="composer-content">
        <div className="compose-section">
          <textarea
            className="tweet-textarea"
            value={text}
            onChange={handleTextChange}
            placeholder="What's on your mind?"
            maxLength={MAX_CHARS}
          />
          <div className="textarea-footer">
            <span className="char-count">
              {text.length} / {MAX_CHARS}
            </span>
            <button onClick={handleTryAnother} className="try-another-button">
              Try another example
            </button>
          </div>
        </div>

        <div className="preview-section">
          <div className="preview-cards">
            <TweetCard
              text={text}
              width={MAX_WIDTH}
              showWasted={true}
              label={`Default (${MAX_WIDTH}px)`}
            />
            <TweetCard
              text={text}
              width={optimalWidth}
              showWasted={false}
              label={`Pretext-optimized (${optimalWidth}px)`}
            />
          </div>
        </div>

        <div className="stats-section">
          <div className="stat">
            <span className="stat-label">Characters:</span>
            <span className="stat-value">{text.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Lines:</span>
            <span className="stat-value">{lineCount}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Pixels saved:</span>
            <span className="stat-value stat-highlight">
              {pixelsSaved}px ({percentSaved}%)
            </span>
          </div>
        </div>

        <div className="explanation">
          <p>
            <strong>What's happening:</strong> As you type, Pretext computes the tightest width that
            keeps the same line count as the 550px layout. No orphan words, no wasted space. The
            optimized card is always the perfect width for its content.
          </p>
          {wastedPixelsAtMaxWidth > 50 && (
            <p className="wasted-note">
              The default card has <strong>{wastedPixelsAtMaxWidth}px</strong> of wasted space
              because the longest line is much shorter than 550px.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default TweetComposer;
