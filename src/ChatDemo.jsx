import { useState, useEffect, useRef, useMemo } from 'react';
import { prepare, layout } from '@chenglou/pretext';

const BUBBLE_FONT = '15px -apple-system, system-ui, sans-serif';
const LINE_HEIGHT = 22;
const BUBBLE_PADDING_Y = 16;
const BUBBLE_PADDING_X = 24;
const BUBBLE_MAX_WIDTH = 280;
const MESSAGE_GAP = 4;
const SENDER_LABEL_HEIGHT = 18;
const OVERSCAN = 600;

const SHORT_MESSAGES = [
  "lol",
  "for real?",
  "yeah",
  "no way",
  "k",
  "omw",
  "ttyl",
  "👍",
  "🔥🔥🔥",
  "lmao",
  "true",
  "ngl",
  "wait what",
  "bruh",
  "💀",
];

const MEDIUM_MESSAGES = [
  "Hey are you coming to the trail run on Saturday? I heard the weather is going to be perfect",
  "Just finished a 15k around the lake, my legs are dead but it was so worth it 🏃",
  "Did you see the new shoes Hoka dropped? Considering grabbing a pair before the half marathon",
  "Group ride canceled tomorrow because of rain. Anyone want to do a treadmill session instead?",
  "Random question but does anyone have recommendations for trail apps that work offline?",
  "Just signed up for the Ultra in October. Time to actually start training properly lol",
  "The new GPS watch I got has like 40 different metrics, I have no idea what half of them mean",
];

const LONG_MESSAGES = [
  "So I tried that new route through the redwoods today and honestly it was one of the best runs I've ever done. The terrain was technical enough to be interesting but not so brutal that you couldn't enjoy it. There's this one section about 4 miles in where the canopy opens up and you get a view all the way to the coast. I almost stopped to take a picture but I was in a flow state and didn't want to break it. Highly recommend if anyone's looking for a new spot.",
  "Quick PSA for anyone running the half next weekend: the organizers just posted that the start time moved up by 30 minutes because of expected heat. Make sure you check your registration email for the updated schedule. Also they're not allowing handheld bottles this year apparently, only hydration vests or belts. Kind of annoying for a half but I guess they're trying to reduce trash on the course.",
  "I've been thinking a lot about why I run lately. Like, I started doing this five years ago because I wanted to lose weight, and I did, but at some point it stopped being about that and became something else entirely. I think it's the only time in my day where my brain actually quiets down. Everything else feels like noise. When I'm running long distances, especially on trails, there's this mental clarity that I can't get from anything else. Not meditation, not therapy, not even sleep. Just running.",
  "Okay I need to vent. Did my first race in two years today and my Garmin lost satellite connection like four times during the run. Final time on the watch was way off from the official chip time. I trained for six months and I literally can't tell what my actual splits were because the data is garbage. Anyone else had this happen with the new firmware? I'm seriously considering just going back to my old watch.",
];

const NAMES = ["Sam", "Alex", "Jordan", "Riley", "Casey", "Morgan", "Taylor", "Jamie"];

function generateMessages(count) {
  const messages = [];
  for (let i = 0; i < count; i++) {
    const r = (i * 7919) % 100;
    let text;
    if (r < 50) text = SHORT_MESSAGES[i % SHORT_MESSAGES.length];
    else if (r < 85) text = MEDIUM_MESSAGES[i % MEDIUM_MESSAGES.length];
    else text = LONG_MESSAGES[i % LONG_MESSAGES.length];

    messages.push({
      id: i,
      text,
      from: i % 2 === 0 ? 'them' : 'me',
      sender: NAMES[i % NAMES.length],
    });
  }
  return messages;
}

function computeChatLayout(messages) {
  const start = performance.now();
  const laidOut = [];
  let currentY = 16;

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const prev = i > 0 ? messages[i - 1] : null;
    const showSenderLabel = !prev || prev.from !== msg.from;

    const prepared = prepare(msg.text, BUBBLE_FONT);
    const { height: textHeight } = layout(
      prepared,
      BUBBLE_MAX_WIDTH - BUBBLE_PADDING_X,
      LINE_HEIGHT
    );
    const bubbleHeight = textHeight + BUBBLE_PADDING_Y;

    let totalHeight = bubbleHeight + MESSAGE_GAP;
    if (showSenderLabel) totalHeight += SENDER_LABEL_HEIGHT;

    laidOut.push({
      message: msg,
      top: currentY,
      height: totalHeight,
      bubbleHeight,
      showSenderLabel,
    });

    currentY += totalHeight;
  }

  return {
    laidOut,
    totalHeight: currentY + 16,
    computeTimeMs: performance.now() - start,
  };
}

function findFirstVisibleIndex(laidOut, scrollTop) {
  let lo = 0;
  let hi = laidOut.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const item = laidOut[mid];
    if (item.top + item.height < scrollTop) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function ChatDemo({ onBack }) {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [mountedCount, setMountedCount] = useState(0);
  const [highlightedId, setHighlightedId] = useState(null);
  const scrollContainerRef = useRef(null);
  const rafRef = useRef(null);

  // Generate messages once
  const messages = useMemo(() => generateMessages(10000), []);

  // Compute layout once
  const { laidOut, totalHeight, computeTimeMs } = useMemo(
    () => computeChatLayout(messages),
    [messages]
  );

  // Find visible messages
  const visibleMessages = useMemo(() => {
    if (!laidOut.length || viewportHeight === 0) return [];

    const viewStart = Math.max(0, scrollTop - OVERSCAN);
    const viewEnd = scrollTop + viewportHeight + OVERSCAN;

    const firstIdx = findFirstVisibleIndex(laidOut, viewStart);
    const visible = [];

    for (let i = firstIdx; i < laidOut.length; i++) {
      const item = laidOut[i];
      if (item.top > viewEnd) break;
      visible.push(item);
    }

    return visible;
  }, [laidOut, scrollTop, viewportHeight]);

  // Update mounted count
  useEffect(() => {
    setMountedCount(visibleMessages.length);
  }, [visibleMessages.length]);

  // Handle scroll with RAF throttling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        setScrollTop(container.scrollTop);
        rafRef.current = null;
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  // Measure viewport height
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const updateHeight = () => {
      setViewportHeight(container.clientHeight);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const jumpToMessage = (messageId) => {
    const item = laidOut[messageId];
    if (item && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = item.top - 100;
      setHighlightedId(messageId);
      setTimeout(() => setHighlightedId(null), 1000);
    }
  };

  const verifyAccuracy = () => {
    const errors = [];
    visibleMessages.forEach((item) => {
      const element = document.getElementById(`msg-${item.message.id}`);
      if (element) {
        const rect = element.getBoundingClientRect();
        const container = scrollContainerRef.current.getBoundingClientRect();
        const actualTop = rect.top - container.top + scrollContainerRef.current.scrollTop;
        const predictedTop = item.top;
        const diff = Math.abs(actualTop - predictedTop);
        if (diff > 1) {
          errors.push({
            id: item.message.id,
            predicted: predictedTop,
            actual: actualTop,
            diff,
          });
        }
      }
    });

    if (errors.length === 0) {
      console.log(`✓ All ${visibleMessages.length} visible messages match Pretext predictions`);
    } else {
      console.error(`✗ Found ${errors.length} mismatches:`, errors);
    }
  };

  return (
    <div className="chat-demo">
      <div className="chat-header">
        <button onClick={onBack} className="header-back">
          ← Back
        </button>
        <div className="header-content">
          <div className="header-title">
            <span className="chat-name">Trail Runners 🏃</span>
            <span className="message-count">{messages.length.toLocaleString()} messages</span>
          </div>
          <div className="header-avatar">T</div>
        </div>
      </div>

      <div className="chat-stats">
        <span>Messages: <strong>{messages.length.toLocaleString()}</strong></span>
        <span>DOM nodes: <strong>~{mountedCount}</strong></span>
        <span>Layout time: <strong>{computeTimeMs.toFixed(1)}ms</strong></span>
        <button onClick={verifyAccuracy} className="verify-link">Verify</button>
      </div>

      <div className="chat-scroll-container" ref={scrollContainerRef}>
        <div className="chat-messages" style={{ height: `${totalHeight}px`, position: 'relative' }}>
          {visibleMessages.map((item) => (
            <div
              key={item.message.id}
              id={`msg-${item.message.id}`}
              className={`message-wrapper ${highlightedId === item.message.id ? 'highlighted' : ''}`}
              style={{
                position: 'absolute',
                top: `${item.top}px`,
                left: item.message.from === 'me' ? 'auto' : '16px',
                right: item.message.from === 'me' ? '16px' : 'auto',
              }}
            >
              {item.showSenderLabel && item.message.from === 'them' && (
                <div className="sender-label">{item.message.sender}</div>
              )}
              <div className={`message-bubble ${item.message.from}`}>
                {item.message.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="jump-controls">
        <button onClick={() => jumpToMessage(0)} className="jump-button">
          Jump to start
        </button>
        <button onClick={() => jumpToMessage(5000)} className="jump-button">
          Jump to #5000
        </button>
        <button onClick={() => jumpToMessage(9999)} className="jump-button">
          Jump to end
        </button>
      </div>
    </div>
  );
}

export default ChatDemo;
