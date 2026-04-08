import { useState } from 'react';
import LayoutThrashingDemo from './demos/LayoutThrashingDemo';
import StreamingJankDemo from './demos/StreamingJankDemo';
import './DemoApp.css';

function DemoApp() {
  const [activeDemo, setActiveDemo] = useState('thrashing');

  return (
    <div className="demo-app">
      <header className="demo-header">
        <h1>What Does Pretext Actually Solve?</h1>
        <p>See the REAL problems and solutions, not just prettier chat bubbles</p>
      </header>

      <nav className="demo-nav">
        <button
          className={activeDemo === 'thrashing' ? 'active' : ''}
          onClick={() => setActiveDemo('thrashing')}
        >
          Layout Thrashing
        </button>
        <button
          className={activeDemo === 'streaming' ? 'active' : ''}
          onClick={() => setActiveDemo('streaming')}
        >
          Streaming Jank
        </button>
      </nav>

      <main className="demo-main">
        {activeDemo === 'thrashing' && <LayoutThrashingDemo />}
        {activeDemo === 'streaming' && <StreamingJankDemo />}
      </main>

      <footer className="demo-footer">
        <h3>The Bottom Line</h3>
        <p>
          <strong>Pretext solves:</strong> Performance problems when you need to measure text
          before rendering it. Useful for virtual scrolling, streaming content, and SSR.
        </p>
        <p>
          <strong>Pretext doesn't solve:</strong> Making chat bubbles slightly prettier.
          That's a nice side effect, not the main point.
        </p>
        <p className="verdict-box">
          <strong>Do you need it?</strong> If you're building Twitter, ChatGPT, or Notion - yes.
          If you're building a CRUD app with some text - no.
        </p>
      </footer>
    </div>
  );
}

export default DemoApp;
