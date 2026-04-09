import { useState, useEffect, useRef, useMemo } from 'react';
import { prepareWithSegments, layout } from '@chenglou/pretext';

const TITLE_FONT = '600 16px -apple-system, system-ui, sans-serif'; // matches .card-title
const BODY_FONT = '15px -apple-system, system-ui, sans-serif';       // matches .card-body
const TITLE_LINE_HEIGHT = Math.round(16 * 1.4); // 22px — matches line-height: 1.4 in CSS
const BODY_LINE_HEIGHT = 22;                    // matches line-height: 22px in CSS
const CARD_PADDING = 16;
const CARD_HEADER_HEIGHT = 20; // single flex row at 14px font (~20px rendered)
const HEADER_MARGIN = 12;      // margin-bottom on .card-header
const TITLE_MARGIN = 12;       // margin-bottom on .card-title
const CARD_HORIZONTAL_PADDING = CARD_PADDING * 2;
const COLUMN_GAP = 16;
const OVERSCAN = 500; // Pixels to render above/below viewport

// Generate LogRocket-related topic cards
function generateCards(count) {
  const topics = [
    { title: 'Debugging React Performance Issues with Session Replay', author: 'Sarah Chen' },
    { title: 'Best Practices for Error Tracking in Production', author: 'Mike Rodriguez' },
    { title: 'How to Monitor Core Web Vitals in Real-Time', author: 'Emma Thompson' },
    { title: 'Understanding User Behavior Through Session Replays', author: 'Alex Kumar' },
    { title: 'Optimizing Bundle Size for Faster Page Loads', author: 'Jordan Lee' },
    { title: 'Advanced Network Monitoring Techniques', author: 'Chris Martinez' },
    { title: 'Implementing Feature Flags Without Breaking Production', author: 'Taylor Swift' },
    { title: 'Redux DevTools Integration Best Practices', author: 'Morgan Freeman' },
    { title: 'Measuring JavaScript Performance in the Wild', author: 'Jamie Park' },
    { title: 'Understanding Memory Leaks in Single Page Applications', author: 'Sam Wilson' },
    { title: 'Crash Reporting for Mobile Web Applications', author: 'Dana White' },
    { title: 'Building Better Error Boundaries in React', author: 'Riley Cooper' },
    { title: 'Tracking Third-Party Script Performance', author: 'Casey Johnson' },
    { title: 'A/B Testing Without Sacrificing Performance', author: 'Avery Taylor' },
    { title: 'Monitoring API Response Times at Scale', author: 'Quinn Davis' },
  ];

  const descriptions = [
    'Learn how to identify and fix common performance bottlenecks in React applications using modern profiling tools and session replay data.',
    'A comprehensive guide to setting up robust error tracking that actually helps you fix bugs faster.',
    'Real-time monitoring strategies for Core Web Vitals that help you stay ahead of performance regressions.',
    'Discover patterns in user behavior that traditional analytics miss by analyzing session replays.',
    'Practical techniques for reducing JavaScript bundle size without sacrificing developer experience.',
    'Deep dive into network waterfall analysis and how to optimize API call patterns.',
    'A step-by-step guide to implementing feature flags safely in production environments.',
    'How to leverage Redux DevTools with LogRocket to debug complex state management issues.',
    'Techniques for collecting accurate performance metrics from real user sessions.',
    'Common causes of memory leaks in SPAs and how to detect them before they impact users.',
    'Best practices for implementing crash reporting that provides actionable debugging information.',
    'Building resilient React applications with proper error boundary patterns and fallback UIs.',
    'How to measure the performance impact of third-party scripts and make data-driven decisions.',
    'Implementing A/B tests without adding unnecessary JavaScript or slowing down your application.',
    'Strategies for monitoring API performance across different user segments and geographic regions.',
    'Using distributed tracing to understand full-stack performance bottlenecks.',
    'How to set up custom metrics that matter for your specific application and user base.',
    'Debugging WebSocket connections and real-time communication issues with session replay.',
    'Advanced techniques for reducing Time to Interactive and improving perceived performance.',
    'Understanding and optimizing the critical rendering path for faster initial page loads.',
  ];

  const cards = [];
  for (let i = 0; i < count; i++) {
    const topic = topics[i % topics.length];
    const descIndex = Math.floor(Math.random() * descriptions.length);
    const descLength = 1 + Math.floor(Math.random() * 3); // 1-3 sentences
    const description = descriptions
      .slice(descIndex, descIndex + descLength)
      .join(' ');

    const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

    cards.push({
      id: i,
      title: topic.title,
      author: topic.author,
      timestamp: timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      body: description,
    });
  }

  return cards;
}

function MasonryDemo({ onBack }) {
  const [cardCount, setCardCount] = useState(1500);
  const [columnCount, setColumnCount] = useState(3);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [mountedCount, setMountedCount] = useState(0);
  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const rafRef = useRef(null);

  // Generate cards
  const cards = useMemo(() => generateCards(cardCount), [cardCount]);

  // Compute layout with Pretext
  const { positions, totalHeight, layoutTime } = useMemo(() => {
    if (containerWidth === 0) return { positions: [], totalHeight: 0, layoutTime: 0 };

    const startTime = performance.now();

    const columnWidth = (containerWidth - (columnCount - 1) * COLUMN_GAP) / columnCount;
    const contentWidth = columnWidth - CARD_HORIZONTAL_PADDING;

    const columnHeights = new Array(columnCount).fill(0);
    const positions = [];

    cards.forEach((card) => {
      // Measure title with its actual rendered font (600 16px, line-height 1.4)
      const titlePrepared = prepareWithSegments(card.title, TITLE_FONT);
      const { lineCount: titleLines } = layout(titlePrepared, contentWidth, TITLE_LINE_HEIGHT);

      // Measure body with its actual rendered font (15px, line-height 22px)
      const bodyPrepared = prepareWithSegments(card.body, BODY_FONT);
      const { lineCount: bodyLines } = layout(bodyPrepared, contentWidth, BODY_LINE_HEIGHT);

      // Total card height mirrors the DOM exactly:
      // padding-top + header + header-margin + title + title-margin + body + padding-bottom
      const cardHeight =
        CARD_PADDING +
        CARD_HEADER_HEIGHT + HEADER_MARGIN +
        titleLines * TITLE_LINE_HEIGHT + TITLE_MARGIN +
        bodyLines * BODY_LINE_HEIGHT +
        CARD_PADDING;

      // Find shortest column
      const shortestCol = columnHeights.indexOf(Math.min(...columnHeights));

      // Position this card
      const x = shortestCol * (columnWidth + COLUMN_GAP);
      const y = columnHeights[shortestCol];

      positions.push({
        id: card.id,
        x,
        y,
        width: columnWidth,
        height: cardHeight,
      });

      // Update column height
      columnHeights[shortestCol] += cardHeight + COLUMN_GAP;
    });

    const totalHeight = Math.max(...columnHeights);
    const layoutTime = performance.now() - startTime;

    return { positions, totalHeight, layoutTime };
  }, [cards, containerWidth, columnCount]);

  // Virtualization: only render visible cards
  const visibleCards = useMemo(() => {
    const visible = [];
    const viewStart = scrollTop - OVERSCAN;
    const viewEnd = scrollTop + viewportHeight + OVERSCAN;

    positions.forEach((pos, index) => {
      if (pos.y + pos.height >= viewStart && pos.y <= viewEnd) {
        visible.push({
          ...cards[index],
          ...pos,
        });
      }
    });

    return visible;
  }, [positions, cards, scrollTop, viewportHeight]);

  // Update mounted count
  useEffect(() => {
    setMountedCount(visibleCards.length);
  }, [visibleCards.length]);

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

  // Measure container width and viewport height
  useEffect(() => {
    const container = containerRef.current;
    const scrollContainer = scrollContainerRef.current;
    if (!container || !scrollContainer) return;

    const updateDimensions = () => {
      setContainerWidth(container.offsetWidth);
      setViewportHeight(scrollContainer.clientHeight);
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Verify accuracy
  const verifyAccuracy = () => {
    const errors = [];
    visibleCards.forEach((card) => {
      const element = document.getElementById(`card-${card.id}`);
      if (element) {
        const actual = element.offsetHeight;
        const predicted = card.height;
        const diff = Math.abs(actual - predicted);
        if (diff > 1) {
          errors.push({ id: card.id, predicted, actual, diff });
        }
      }
    });

    if (errors.length === 0) {
      console.log(`✓ All ${visibleCards.length} visible cards match Pretext predictions`);
    } else {
      console.error(`✗ Found ${errors.length} mismatches:`, errors);
    }
  };

  return (
    <div className="masonry-demo">
      <div className="stats-bar">
        <button onClick={onBack} className="back-button-inline">← Back</button>

        <div className="stats-row stats-headline">
          <span>Cards in feed: <strong>{cardCount.toLocaleString()}</strong></span>
          <span>Layout time: <strong>{layoutTime.toFixed(1)}ms</strong></span>
          <span>DOM nodes mounted: <strong>{mountedCount}</strong></span>
        </div>

        <div className="stats-row stats-controls">
          <div className="control-group">
            <span className="control-label">Cards:</span>
            <button
              className={`control-button ${cardCount === 1500 ? 'active' : ''}`}
              onClick={() => setCardCount(1500)}
            >
              1,500
            </button>
            <button
              className={`control-button ${cardCount === 5000 ? 'active' : ''}`}
              onClick={() => setCardCount(5000)}
            >
              5,000
            </button>
            <button
              className={`control-button ${cardCount === 10000 ? 'active' : ''}`}
              onClick={() => setCardCount(10000)}
            >
              10,000
            </button>
          </div>

          <div className="control-group">
            <span className="control-label">Columns:</span>
            <button
              className={`control-button ${columnCount === 2 ? 'active' : ''}`}
              onClick={() => setColumnCount(2)}
            >
              2 cols
            </button>
            <button
              className={`control-button ${columnCount === 3 ? 'active' : ''}`}
              onClick={() => setColumnCount(3)}
            >
              3 cols
            </button>
            <button
              className={`control-button ${columnCount === 4 ? 'active' : ''}`}
              onClick={() => setColumnCount(4)}
            >
              4 cols
            </button>
          </div>

          <button className="verify-button" onClick={verifyAccuracy}>
            Verify accuracy
          </button>
        </div>

        <div className="stats-row stats-punchline">
          <span>Total height of feed: <strong>{Math.round(totalHeight).toLocaleString()}px</strong></span>
          <span>Pretext measurements: <strong>{positions.length}</strong></span>
          <span>DOM measurements: <strong>0</strong></span>
        </div>
      </div>

      <div className="masonry-scroll-container" ref={scrollContainerRef}>
        <div className="masonry-header">
          <h1>Pretext virtualized masonry</h1>
          <p className="masonry-subtitle">
            {cardCount.toLocaleString()} cards. Every height computed before render. Pure arithmetic.
          </p>
        </div>

        <div
          className="masonry-container"
          ref={containerRef}
          style={{ height: `${totalHeight}px`, position: 'relative' }}
        >
          {visibleCards.map((card) => (
            <div
              key={card.id}
              id={`card-${card.id}`}
              className="masonry-card"
              style={{
                position: 'absolute',
                left: `${card.x}px`,
                top: `${card.y}px`,
                width: `${card.width}px`,
              }}
            >
              <div className="card-header">
                <span className="card-author">{card.author}</span>
                <span className="card-timestamp">{card.timestamp}</span>
              </div>
              <h3 className="card-title">{card.title}</h3>
              <p className="card-body">{card.body}</p>
            </div>
          ))}
        </div>

        <div className="masonry-footer">
          You just scrolled through {cardCount.toLocaleString()} cards. The browser made zero text
          measurements. Every card height was computed by Pretext in pure JavaScript before any DOM
          nodes were mounted.
        </div>
      </div>
    </div>
  );
}

export default MasonryDemo;
