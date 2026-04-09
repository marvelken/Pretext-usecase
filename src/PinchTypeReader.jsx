import { useEffect, useRef, useState, useCallback } from 'react';
import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

// ---------------------------------------------------------------------------
// Article text
// ---------------------------------------------------------------------------
const ARTICLE = `What if you laid out your UI without CSS?

There is an inside joke in frontend development, and pretty much every senior engineer who has ever shipped a chat UI knows it: CSS has no idea how tall your text is going to be until it renders it. Think about that.

Let's assume you are building a messaging app. A user types "lol" and the bubble wraps perfectly. Another user pastes a paragraph with emoji, Arabic mixed with English, and a code snippet. The bubble either overflows, clips, or does that awful thing where it renders one width, measures, recalculates, and jumps, all in front of the user's eyes. You didn't write bad code. CSS just wasn't built for this.

Cheng Lou, a core member of the original React team, just open-sourced a library called Pretext that changes things entirely. It measures text dimensions in pure TypeScript, before the DOM even knows the text exists.

In this article, we'll discuss why this problem exists in the first place, why it has been so annoyingly hard to solve, and then we'll build the thing that CSS never could: perfectly shrinkwrapped chat bubbles in React, with a before-and-after that you can run yourself.

CSS was built for documents, not dynamic UIs

This is not a criticism. It is just history catching up with us. When CSS was designed in the mid-1990s, the web was a document delivery system. The layout model was built to solve a very specific problem: take a stream of text and flow it into a rectangular container, top to bottom, left to right. Headers, paragraphs, lists, and static content with predictable structure.

The box model reflects this perfectly. Every element is a rectangle. The browser figures out the dimensions after it processes the content. This is called the render-then-measure paradigm, and for documents, it works beautifully. Now the issue is that modern UIs are not documents.

A chat bubble needs to fit its content before the content is rendered. A virtualized feed needs to know the height of 10,000 messages without rendering any of them. A streaming AI response needs to reflow every time a new token arrives. These are all cases where you need measurements first and rendering second, and oh well, CSS gives you the opposite.

The CSS specification itself acknowledges the tension. Properties like intrinsic-size, contain-intrinsic-size, and content-visibility all exist because the working group recognizes that the render-then-measure model breaks down at scale. But they're patches on top of a foundation that was never designed for pre-render measurement.

OK, but how bad is this actually?

The natural CSS instinct gets you to 70%, but try these edge cases. A message that is exactly one pixel wider than 320px — CSS wraps a single word to the next line, and now your bubble is 320px wide with a lonely orphan word sitting underneath. The bubble could have been 161px wide with two balanced lines, but CSS has no concept of "try narrower and see if the line count stays the same."

A streamed AI response arriving token by token means each new token triggers a layout recalculation. The bubble width changes. Emoji mixed with CJK text means Safari measures emoji widths differently through Canvas versus the DOM. Your carefully calculated heights are off by several pixels, and the bug only shows up on iPhones.

The typical JavaScript fix is to render text into a hidden element, measure it with getBoundingClientRect or ResizeObserver, then use that measurement to set the real element's dimensions. Every single call to getBoundingClientRect or offsetHeight forces the browser to pause JavaScript execution and recalculate the entire page's geometry. For a page with 500 chat messages, that's 500 layout reflows. On a mid-range Android phone, you may feel it.

So how did Cheng Lou actually crack this?

Let me walk you through the thinking. You are building a chat app. The main view is a scrollable list of messages. And one day, a user opens a Bible study group chat with about 10,000 messages from the last six months.

You can't render all 10,000 to the DOM. Your phone will blow up. So you do what every senior frontend engineer does: you reach for virtualization. Only render the messages currently in the viewport. Recycle the rest. Standard procedure.

To virtualize properly, you need to know the height of every single message before you render it. Because the scrollbar has to be the right size. The scroll position has to land on the right message when someone jumps to "last week." All of that math depends on heights you don't have yet.

Option 1: Render every message off-screen, measure them, then throw them away. You've just done the work you were trying to avoid. Each measurement triggers a forced layout reflow. 10,000 messages means 10,000 reflows. Your initial render takes four seconds.

Option 2: Estimate. Set every message to "probably 80 pixels" and pray. The scrollbar is now lying to the user. They drag it halfway down expecting to land in June, and they end up in February.

Option 3: Measure on first render and cache. This is what most virtualization libraries do today. The first time a message appears, you measure it, save the height, and reuse it next time. You still pay the reflow cost, but it works.

Option 4: Quit frontend and become a goat farmer. Honestly, the most appealing option some days.

Here's the thing nobody realized for fifteen years: you don't actually need the DOM to know how tall a piece of text is. You just need the font, the text, and some math. The browser already knows how wide every character is in every font — that information lives in the font engine, completely separate from the layout engine. The DOM is just the messenger.

Cheng Lou's insight was to skip the messenger entirely.

The width problem turned out to be the easy part. There's an old browser API called Canvas, yes, the same one people use for HTML5 games, and inside it lives a function called measureText(). It's been there since forever. You give it a string and a font, and it gives you back the exact pixel width. It just asks the font engine directly.

But with the width, we are only half there. To know how tall a paragraph will be, you need to know where the lines break. And line breaking is genuinely hard. Different browsers handle it differently. CJK languages break per-character. Thai has no spaces. Arabic flows right-to-left and merges punctuation into clusters. Emoji sequences with skin-tone modifiers count as one grapheme even though they're technically five code points. Every one of these is a special case.

Cheng didn't write the line-breaking algorithm by hand. Or rather, he didn't write all of it by hand. He set up a feedback loop: he had AI agents write candidate implementations, then ran them against actual browser output across hundreds of test cases — different fonts, different languages, different widths, different edge cases. When the algorithm disagreed with the browser, the AI would iterate. Fix the bug, rerun the tests, repeat. For weeks.

What came out at the end was a 5KB library with two functions and 100% accuracy against browser ground truth. The kind of thing that looks obvious in hindsight and impossible in foresight.

What does Pretext actually do differently?

With Pretext, instead of rendering text and then asking the browser how big it is, Pretext figures out the dimensions using pure math, before the text ever touches the DOM.

Two functions, two phases. prepare() does the expensive work once. It takes your text and font, normalizes whitespace according to the CSS spec, segments the text using Intl.Segmenter, measures each segment using Canvas measureText, and caches everything by segment and font key. This runs in about 1–5ms.

layout() does the cheap work every time after that. It walks the cached segment widths, accumulates them until maxWidth is reached, and breaks to a new line — pure arithmetic. Each call takes roughly 0.0002ms. That is not a typo. You can call it on every animation frame and it will not even register on a performance profile.

The separation is the insight. prepare() is the one-time font analysis. layout() is the hot path. When the user resizes the window, you don't re-prepare, you just re-layout. When a new token streams in from an AI response, you prepare the new token once and layout as many times as you need.

What else opens up — and these are things you build every week

Virtualized lists that don't lie about item heights. If you've used react-window, react-virtuoso, or TanStack Virtual, you've dealt with this: the library needs to know item heights before rendering, and you don't have them. So you estimate. You set itemSize to 80 and hope for the best. Then a user posts a three-paragraph comment and the scrollbar jumps.

With Pretext, you compute exact heights before mounting a single element. Zero estimation. Zero post-render measurement. Zero scroll jumpiness. For a feed with 10,000 items, the difference is dramatic. Traditional DOM measurement forces 10,000 layout reflows during the initial scroll-through. Pretext does the entire batch in under 2ms of pure arithmetic.

Accordion animations that actually work. Every frontend developer has fought this battle: you want to animate a section open and closed, but CSS cannot transition between height 0 and height auto. It just can't. The spec doesn't support it. So you set max-height to 1000px and hope the content is never taller, or you measure scrollHeight and animate to it explicitly.

With Pretext, you know the expanded height before the animation even starts. No hidden render. No scrollHeight hack. The transition is smooth because you're animating between two exact pixel values. This matters for FAQ pages, settings panels, documentation sidebars, mobile navigation drawers — anywhere you have collapsible content with variable text lengths.

Streaming AI responses without the jitter. Tokens arrive one at a time. Each token potentially changes the bubble width, the bubble height, and the scroll position. The result is that flickering, jittery feel where the bubble is constantly resizing and the page is constantly re-scrolling. With Pretext, you can pre-compute what the bubble will look like as each token arrives. layout() runs in 0.0002ms. The bubble dimensions update before the browser has a chance to render the stale state.

Can you lay out a UI without CSS?

Here's the thing I keep coming back to. We spend years learning CSS layout. Flexbox, Grid, fit-content, min-content, max-content. We memorize the rules, internalize the quirks, and build workarounds for the gaps.

And then someone ships a 5KB library that answers the question CSS was never designed to answer: how tall will this text be before I render it?

That's not a replacement for CSS. You still need CSS for colors, borders, padding, rounded corners — all the visual stuff. But for the layout computation — for knowing where things go and how big they are before they exist in the DOM — Pretext just proved you can do it in pure math.

Can you lay out a UI without CSS? For the part that matters most — text measurement — you just did.

And honestly? That changes everything.`;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const LINE_HEIGHT_RATIO = 1.6;
const PADDING_X = 100;
const MIN_FONT = 12;
const MAX_FONT = 36;
const FRICTION = 0.93;
const MAX_FISHEYE_SCALE = 1.55;
const FISHEYE_SIGMA = 160;

function computeLayout(baseFontSize, canvasWidth, canvasHeight) {
  const font = `${baseFontSize}px Inter, system-ui, sans-serif`;
  const lineHeight = Math.round(baseFontSize * LINE_HEIGHT_RATIO);
  const maxWidth = canvasWidth - PADDING_X * 2;
  const prepared = prepareWithSegments(ARTICLE, font);
  const { lines } = layoutWithLines(prepared, maxWidth, lineHeight);
  return { lines, lineHeight, totalHeight: lines.length * lineHeight, baseFontSize, canvasWidth, canvasHeight };
}

function draw(ctx, anim) {
  const { layout, scrollY } = anim;
  const { lines, lineHeight, baseFontSize, canvasWidth, canvasHeight } = layout;

  ctx.fillStyle = '#0a0a0a';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  const focusY = canvasHeight / 2;
  ctx.textBaseline = 'alphabetic';

  for (let i = 0; i < lines.length; i++) {
    const lineTop = i * lineHeight - scrollY;
    const lineCenter = lineTop + lineHeight * 0.5;
    if (lineCenter < -lineHeight * 2 || lineCenter > canvasHeight + lineHeight * 2) continue;

    const dist = Math.abs(lineCenter - focusY);
    const t = Math.exp(-(dist * dist) / (2 * FISHEYE_SIGMA * FISHEYE_SIGMA));
    const renderedSize = baseFontSize * (1 + (MAX_FISHEYE_SCALE - 1) * t);
    const opacity = 0.18 + 0.82 * t;

    ctx.font = `${renderedSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = `rgba(245,245,245,${opacity.toFixed(3)})`;
    ctx.fillText(lines[i].text, PADDING_X, lineTop + lineHeight * 0.82);
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
function PinchTypeReader({ onBack }) {
  const canvasRef = useRef(null);
  const animRef = useRef({
    scrollY: 0,
    velocity: 0,
    isDragging: false,
    dragLastY: 0,
    dragVelocity: 0,
    layout: {
      lines: [],
      lineHeight: 0,
      totalHeight: 0,
      baseFontSize: 18,
      canvasWidth: window.innerWidth,
      canvasHeight: window.innerHeight,
    },
  });
  const rafIdRef = useRef(0);
  const ctxRef = useRef(null);

  const [showIntro, setShowIntro] = useState(true);
  const [overlayFading, setOverlayFading] = useState(false);
  const [hud, setHud] = useState({ fontSize: 18, zoom: 100, lines: 0 });

  const setupCanvas = useCallback((overrideFontSize) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;

    const fs = overrideFontSize ?? animRef.current.layout.baseFontSize;
    const newLayout = computeLayout(fs, w, h);
    animRef.current.layout = newLayout;

    const maxScroll = Math.max(0, newLayout.totalHeight - h);
    if (animRef.current.scrollY > maxScroll) animRef.current.scrollY = maxScroll;

    setHud({ fontSize: fs, zoom: Math.round((fs / 18) * 100), lines: newLayout.lines.length });
  }, []);

  const startLoop = useCallback(() => {
    cancelAnimationFrame(rafIdRef.current);
    const tick = () => {
      const anim = animRef.current;
      const ctx = ctxRef.current;
      if (!ctx) { rafIdRef.current = requestAnimationFrame(tick); return; }

      if (!anim.isDragging && Math.abs(anim.velocity) > 0.1) {
        anim.scrollY += anim.velocity;
        anim.velocity *= FRICTION;
        const maxScroll = Math.max(0, anim.layout.totalHeight - anim.layout.canvasHeight);
        if (anim.scrollY < 0) { anim.scrollY = 0; anim.velocity = 0; }
        if (anim.scrollY > maxScroll) { anim.scrollY = maxScroll; anim.velocity = 0; }
      }

      draw(ctx, anim);
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    setupCanvas();
    startLoop();

    let resizeTimer;
    const onResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(setupCanvas, 100);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [setupCanvas, startLoop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e) => {
      e.preventDefault();
      const anim = animRef.current;
      if (e.metaKey || e.ctrlKey) {
        const delta = e.deltaY > 0 ? -1 : 1;
        const newSize = Math.max(MIN_FONT, Math.min(MAX_FONT, anim.layout.baseFontSize + delta));
        if (newSize !== anim.layout.baseFontSize) setupCanvas(newSize);
      } else {
        anim.velocity += e.deltaY * 0.6;
        anim.velocity = Math.max(-80, Math.min(80, anim.velocity));
      }
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, [setupCanvas]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e) => {
      const anim = animRef.current;
      anim.isDragging = true;
      anim.dragLastY = e.clientY;
      anim.dragVelocity = 0;
      anim.velocity = 0;
      canvas.style.cursor = 'grabbing';
    };
    const onMouseMove = (e) => {
      const anim = animRef.current;
      if (!anim.isDragging) return;
      const delta = anim.dragLastY - e.clientY;
      anim.dragVelocity = delta;
      anim.scrollY += delta;
      const maxScroll = Math.max(0, anim.layout.totalHeight - anim.layout.canvasHeight);
      anim.scrollY = Math.max(0, Math.min(maxScroll, anim.scrollY));
      anim.dragLastY = e.clientY;
    };
    const onMouseUp = () => {
      const anim = animRef.current;
      if (!anim.isDragging) return;
      anim.isDragging = false;
      anim.velocity = anim.dragVelocity * 2.5;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    canvas.style.cursor = 'grab';

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const handleStart = () => {
    setOverlayFading(true);
    setTimeout(() => setShowIntro(false), 400);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0a0a0a', zIndex: 100 }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          background: 'rgba(255,255,255,0.07)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8,
          padding: '8px 14px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontSize: 13,
          color: 'rgba(255,255,255,0.6)',
          cursor: 'pointer',
          zIndex: 20,
        }}
      >
        ← Back
      </button>

      {/* HUD */}
      <div style={{
        position: 'fixed',
        top: 16,
        right: 16,
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 8,
        padding: '10px 14px',
        fontFamily: 'monospace',
        fontSize: 11,
        color: 'rgba(255,255,255,0.45)',
        lineHeight: 1.8,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 20,
      }}>
        <div>Font: {hud.fontSize}px</div>
        <div>Zoom: {hud.zoom}%</div>
        <div>Lines: {hud.lines}</div>
      </div>

      {/* Branding */}
      <div style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 11,
        color: 'rgba(255,255,255,0.22)',
        userSelect: 'none',
        whiteSpace: 'nowrap',
        zIndex: 20,
      }}>
        Built with{' '}
        <a
          href="https://github.com/chenglou/pretext"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'rgba(255,255,255,0.38)', textDecoration: 'underline' }}
        >
          @chenglou/pretext
        </a>
      </div>

      {/* Intro overlay */}
      {showIntro && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.72)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          opacity: overlayFading ? 0 : 1,
          transition: 'opacity 0.4s ease',
          zIndex: 30,
        }}>
          <div style={{
            background: 'rgba(12,12,12,0.96)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            padding: '36px 40px',
            maxWidth: 420,
            width: '90vw',
            textAlign: 'center',
            fontFamily: 'Inter, system-ui, sans-serif',
            color: '#f5f5f5',
          }}>
            <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 500, letterSpacing: '-0.3px' }}>
              Pinch-Type Reader
            </h1>
            <p style={{ margin: '0 0 28px', fontSize: 14, color: 'rgba(255,255,255,0.42)', lineHeight: 1.6 }}>
              Text rendering that responds to your attention
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28, textAlign: 'left' }}>
              {[
                { key: '⬆ ⬇ Wheel', label: 'Read the article' },
                { key: '⌘ + Scroll', label: 'Zoom text size' },
                { key: '⊹ Click+Drag', label: 'Flick to scroll' },
              ].map(({ key, label }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: 11,
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '4px 10px',
                    color: 'rgba(255,255,255,0.55)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {key}
                  </span>
                  <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{label}</span>
                </div>
              ))}
            </div>

            <button
              onClick={handleStart}
              style={{
                background: '#f5f5f5',
                color: '#0a0a0a',
                border: 'none',
                borderRadius: 8,
                padding: '11px 28px',
                fontSize: 14,
                fontWeight: 500,
                fontFamily: 'Inter, system-ui, sans-serif',
                cursor: 'pointer',
                width: '100%',
                letterSpacing: '-0.1px',
              }}
            >
              Start reading
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PinchTypeReader;
