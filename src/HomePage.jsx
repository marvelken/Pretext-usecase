function HomePage({ onNavigate }) {
  return (
    <div className="home-page">
      <header className="home-header">
        <h1>Pretext Demo Collection</h1>
        <p className="subtitle">
          Four examples showing how @chenglou/pretext eliminates layout jank
        </p>
      </header>

      <div className="demo-grid">
        <div className="demo-card">
          <div className="demo-number">01</div>
          <h2>Virtualized Chat (10,000 Messages)</h2>
          <p>
            Scroll through 10,000 chat messages with buttery-smooth performance. Every
            message height is computed by Pretext before render. Only ~30 DOM nodes exist
            at any time. Jump to message #5000 and watch it land perfectly.
          </p>
          <ul className="demo-features">
            <li>10,000 messages, ~30 DOM nodes</li>
            <li>Binary search virtualization</li>
            <li>Jump-to-message accuracy</li>
            <li>iMessage-style aesthetic</li>
          </ul>
          <button onClick={() => onNavigate('chat')} className="demo-button">
            View Demo →
          </button>
        </div>

        <div className="demo-card">
          <div className="demo-number">02</div>
          <h2>Virtualized Masonry Grid</h2>
          <p>
            Scroll through 10,000 cards with zero DOM measurements. Every card height is
            computed by Pretext before render. Combine with virtualization for buttery-smooth
            infinite feeds.
          </p>
          <ul className="demo-features">
            <li>1,500 / 5,000 / 10,000 card modes</li>
            <li>2 / 3 / 4 column layouts</li>
            <li>Custom virtualization</li>
            <li>Accuracy verification</li>
          </ul>
          <button onClick={() => onNavigate('masonry')} className="demo-button">
            View Demo →
          </button>
        </div>

        <div className="demo-card">
          <div className="demo-number">03</div>
          <h2>Smart Tweet Composer</h2>
          <p>
            Type a tweet and watch the card width auto-adjust for perfect visual balance.
            No orphan words, no wasted space. Compare default Twitter width vs Pretext-optimized
            width side-by-side.
          </p>
          <ul className="demo-features">
            <li>Real-time width optimization</li>
            <li>Side-by-side comparison</li>
            <li>Wasted space visualization</li>
            <li>Sample tweets included</li>
          </ul>
          <button onClick={() => onNavigate('tweet')} className="demo-button">
            View Demo →
          </button>
        </div>

        <div className="demo-card">
          <div className="demo-number">04</div>
          <h2>Pinch-Type Reader</h2>
          <p>
            Canvas text rendered at a different font size per line — something CSS cannot do.
            The line at your visual focus point renders larger; surrounding lines shrink and fade.
            Pretext handles all the line-breaking math so the fisheye runs at 60fps.
          </p>
          <ul className="demo-features">
            <li>Per-line font scaling on canvas</li>
            <li>Momentum scroll (friction 0.93)</li>
            <li>Click+drag flick scrolling</li>
            <li>Cmd+scroll to zoom base size</li>
          </ul>
          <button onClick={() => onNavigate('pinch')} className="demo-button">
            View Demo →
          </button>
        </div>
      </div>

      <footer className="home-footer">
        <p>
          Built with <a href="https://github.com/chenglou/pretext" target="_blank" rel="noopener noreferrer">@chenglou/pretext</a>
          {' '}— text measurement without touching the DOM
        </p>
      </footer>
    </div>
  );
}

export default HomePage;
