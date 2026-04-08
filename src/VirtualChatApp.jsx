import { useState } from 'react';
import CSSVirtualChat from './components/CSSVirtualChat';
import PretextVirtualChat from './components/PretextVirtualChat';
import './VirtualChatApp.css';

function VirtualChatApp() {
  const [view, setView] = useState('split'); // 'split', 'css', 'pretext'

  return (
    <div className="virtual-chat-app">
      <header className="virtual-header">
        <h1>Virtual Scrolling Chat: CSS vs Pretext</h1>
        <p>10,000 messages - See how Pretext knows heights before rendering</p>

        <div className="view-controls">
          <button
            className={view === 'split' ? 'active' : ''}
            onClick={() => setView('split')}
          >
            Split View
          </button>
          <button
            className={view === 'css' ? 'active' : ''}
            onClick={() => setView('css')}
          >
            CSS Only
          </button>
          <button
            className={view === 'pretext' ? 'active' : ''}
            onClick={() => setView('pretext')}
          >
            Pretext Only
          </button>
        </div>
      </header>

      <div className={`chat-views ${view}`}>
        {(view === 'split' || view === 'css') && (
          <div className="chat-panel">
            <h2>CSS Approach</h2>
            <div className="problem-badge">
              ⚠️ Must render to measure - can't know heights upfront
            </div>
            <CSSVirtualChat />
          </div>
        )}

        {(view === 'split' || view === 'pretext') && (
          <div className="chat-panel">
            <h2>Pretext Approach</h2>
            <div className="success-badge">
              ✓ Pre-calculates all heights - knows exactly what's in viewport
            </div>
            <PretextVirtualChat />
          </div>
        )}
      </div>

      <div className="explanation-section">
        <h3>The Virtualization Problem</h3>
        <p>
          With 10,000 messages, you can't render them all (browser would crash).
          Virtual scrolling only renders what's visible. But to do this, you need to know
          the height of EVERY message to calculate scroll position.
        </p>

        <div className="comparison-grid">
          <div className="comparison-item css-item">
            <h4>CSS Approach (❌ Problematic)</h4>
            <ol>
              <li>Must render each message to measure it</li>
              <li>Use fixed height estimate (e.g., "all messages are 80px")</li>
              <li>Scroll thumb jumps around as real heights are revealed</li>
              <li>Poor UX - you never know where you are in the list</li>
            </ol>
          </div>

          <div className="comparison-item pretext-item">
            <h4>Pretext Approach (✓ Perfect)</h4>
            <ol>
              <li>Pre-calculate all 10,000 heights in ~200ms</li>
              <li>Know exact scroll height upfront</li>
              <li>Render only what's in viewport (maybe 10-20 messages)</li>
              <li>Perfect scroll thumb - smooth, predictable scrolling</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VirtualChatApp;
