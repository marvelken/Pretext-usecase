import { useState, useRef, useEffect } from 'react';

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

function CSSVirtualChat() {
  const TOTAL_MESSAGES = 10000;
  const [messages] = useState(() => generateMessages(TOTAL_MESSAGES));
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef(null);
  const [stats, setStats] = useState({ rendered: 0, estimated: true });

  // CSS approach: Use ESTIMATED heights since we can't measure without rendering
  const ESTIMATED_HEIGHT = 60; // Guess that each message is ~60px
  const totalHeight = TOTAL_MESSAGES * ESTIMATED_HEIGHT;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      setScrollTop(scrollTop);

      // Calculate which messages should be visible based on ESTIMATES
      const start = Math.floor(scrollTop / ESTIMATED_HEIGHT);
      const end = Math.ceil((scrollTop + container.clientHeight) / ESTIMATED_HEIGHT);

      setVisibleRange({
        start: Math.max(0, start - 5), // Buffer
        end: Math.min(TOTAL_MESSAGES, end + 5)
      });

      setStats({
        rendered: end - start,
        estimated: true,
      });
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial calculation

    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const visibleMessages = messages.slice(visibleRange.start, visibleRange.end);
  const offsetTop = visibleRange.start * ESTIMATED_HEIGHT;

  return (
    <div className="virtual-chat-container">
      <div className="stats-bar css">
        <div className="stat">
          <span className="label">Total:</span>
          <span className="value">{TOTAL_MESSAGES.toLocaleString()}</span>
        </div>
        <div className="stat">
          <span className="label">Rendered:</span>
          <span className="value">{stats.rendered}</span>
        </div>
        <div className="stat warning">
          <span className="label">Heights:</span>
          <span className="value">Estimated (⚠️ {ESTIMATED_HEIGHT}px each)</span>
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
            {visibleMessages.map((msg) => (
              <div
                key={msg.id}
                className={`message ${msg.isMine ? 'mine' : 'theirs'}`}
              >
                <div className="message-index">#{msg.id}</div>
                <div className={`bubble ${msg.isMine ? 'mine' : 'theirs'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="info-box css">
        <p><strong>Problem:</strong> CSS can't tell us heights without rendering.
        We have to <em>estimate</em> {ESTIMATED_HEIGHT}px per message.</p>
        <p><strong>Result:</strong> Scroll thumb position is inaccurate.
        Long messages get cut off. Short messages waste space. Not ideal.</p>
      </div>
    </div>
  );
}

export default CSSVirtualChat;
