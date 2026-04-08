import { useState, useEffect } from 'react';
import {
  prepareWithSegments,
  layout
} from '@chenglou/pretext';

function MeasuredPretextBubble({ message, isMine, showMeasurements }) {
  const [optimalWidth, setOptimalWidth] = useState(320);
  const [savings, setSavings] = useState(0);

  useEffect(() => {
    const font = '16px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const maxWidth = 320;
    const lineHeight = 24;
    const prepared = prepareWithSegments(message, font);

    // Get the line count at max width
    const { lineCount: targetLines } = layout(prepared, maxWidth, lineHeight);

    // Binary search for the tightest width
    // that keeps the same line count
    let lo = 0;
    let hi = maxWidth;

    while (hi - lo > 1) {
      const mid = (lo + hi) / 2;
      const { lineCount } = layout(prepared, mid, lineHeight);
      if (lineCount <= targetLines) {
        hi = mid;
      } else {
        lo = mid;
      }
    }

    const optimal = Math.ceil(hi);
    setOptimalWidth(optimal);
    setSavings(maxWidth - optimal);
  }, [message]);

  return (
    <div className="bubble-wrapper">
      <div
        className={`bubble pretext-bubble ${isMine ? 'mine' : 'theirs'}`}
        style={{ width: optimalWidth }}
      >
        {message}
      </div>
      {showMeasurements && (
        <div className={`measurement ${isMine ? 'mine' : 'theirs'}`}>
          {optimalWidth}px
          {savings > 5 && <span className="savings"> (-{savings}px)</span>}
        </div>
      )}
    </div>
  );
}

export default MeasuredPretextBubble;
