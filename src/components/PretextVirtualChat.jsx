import { useState, useRef, useEffect, useMemo } from 'react';
import { prepare, layout } from '@chenglou/pretext';

// Generate realistic chat messages
const generateMessages = (count) => {
  const templates = [
    "Hey!",
    "How are you doing?",
    "This is a longer message that will definitely wrap to multiple lines and show the difference in height calculation",
    "Short one",
    "The quick brown fox jumps over the lazy dog and then continues with some more text to make it interesting",
    "Can we meet tomorrow?",
    "Sure thing! I'll be there at 3pm. See you then! 👋",
    "I've been working on this really interesting project and wanted to share some thoughts about the architecture and implementation details",
    "lol 😂",
    "That's amazing! Congratulations on the achievement! 🎉🎊",
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: i,
    text: templates[i % templates.length],
    isMine: i % 3 === 0,
  }));
};

function PretextVirtualChat() {
  const TOTAL_MESSAGES = 10000;
  const [messages] = useState(() => generateMessages(TOTAL_MESSAGES));
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const [calcTime, setCalcTime] = useState(0);
  const [stats, setStats] = useState({ rendered: 0 });

  // ✨ PRETEXT MAGIC: Pre-calculate ALL heights upfront
  const { heights, positions, totalHeight } = useMemo(() => {
    const start = performance.now();

    const font = '16px Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const maxWidth = 320;
    const lineHeight = 24;
    const padding = 16; // 8px top + 8px bottom
    const messageGap = 12;
    const indexHeight = 20; // Height of message index

    const heights = messages.map(msg => {
      const prepared = prepare(msg.text, font);
      const { height } = layout(prepared, maxWidth, lineHeight);
      return height + padding + indexHeight + messageGap;
    });

    // Calculate cumulative positions so we can binary search later
    const positions = [];
    let currentPos = 0;
    for (let i = 0; i < heights.length; i++) {
      positions.push(currentPos);
      currentPos += heights[i];
    }

    const end = performance.now();
    setCalcTime(end - start);

    return {
      heights,
      positions,
      totalHeight: currentPos,
    };
  }, [messages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      setScrollTop(scrollTop);

      // Binary search to find first visible message
      let start = 0;
      let end = positions.length - 1;

      while (start < end) {
        const mid = Math.floor((start + end) / 2);
        if (positions[mid] < scrollTop) {
          start = mid + 1;
        } else {
          end = mid;
        }
      }

      // Find last visible message
      const viewportBottom = scrollTop + container.clientHeight;
      let lastVisible = start;
      while (lastVisible < positions.length && positions[lastVisible] < viewportBottom) {
        lastVisible++;
      }

      setVisibleRange({
        start: Math.max(0, start - 5),
        end: Math.min(TOTAL_MESSAGES, lastVisible + 5)
      });

      setStats({
        rendered: lastVisible - start,
      });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, [positions]);

  const visibleMessages = messages.slice(visibleRange.start, visibleRange.end);
  const offsetTop = positions[visibleRange.start] || 0;

  return (
    <div className="virtual-chat-container">
      <div className="stats-bar pretext">
        <div className="stat">
          <span className="label">Total:</span>
          <span className="value">{TOTAL_MESSAGES.toLocaleString()}</span>
        </div>
        <div className="stat">
          <span className="label">Rendered:</span>
          <span className="value">{stats.rendered}</span>
        </div>
        <div className="stat success">
          <span className="label">Heights:</span>
          <span className="value">Pre-calculated (✓ {calcTime.toFixed(0)}ms)</span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="scroll-container"
        style={{ height: '600px', overflow: 'auto' }}
      >
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          <div style={{
            position: 'absolute',
            top: offsetTop,
            left: 0,
            right: 0,
          }}>
            {visibleMessages.map((msg, idx) => {
              const messageIndex = visibleRange.start + idx;
              const height = heights[messageIndex];

              return (
                <div
                  key={msg.id}
                  className={`message ${msg.isMine ? 'mine' : 'theirs'}`}
                  style={{ height: `${height}px` }}
                >
                  <div className="message-index">#{msg.id}</div>
                  <div className={`bubble ${msg.isMine ? 'mine' : 'theirs'}`}>
                    {msg.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="info-box pretext">
        <p><strong>Solution:</strong> Pretext calculated all {TOTAL_MESSAGES.toLocaleString()} heights
        in {calcTime.toFixed(0)}ms. No rendering needed!</p>
        <p><strong>Result:</strong> Perfect scroll thumb. Exact positioning.
        Only {stats.rendered} messages rendered at a time. Smooth as butter.</p>
      </div>
    </div>
  );
}

export default PretextVirtualChat;
