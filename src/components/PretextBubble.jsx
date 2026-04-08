import { useState, useEffect } from 'react';
import {
  prepareWithSegments,
  layout
} from '@chenglou/pretext';

function PretextBubble({ message, isMine }) {
  const [optimalWidth, setOptimalWidth] = useState(320);

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

    setOptimalWidth(Math.ceil(hi));
  }, [message]);

  return (
    <div
      className={`bubble pretext-bubble ${isMine ? 'mine' : 'theirs'}`}
      style={{ width: optimalWidth }}
    >
      {message}
    </div>
  );
}

export default PretextBubble;
