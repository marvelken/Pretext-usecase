# Pretext Demo Collection

Two interactive demos showing how [@chenglou/pretext](https://github.com/chenglou/pretext) enables performance optimizations that were previously impossible.

## Install & Run

```bash
npm install
npm run dev
```

Then open http://localhost:5173/ in your browser.

---

## Demo 1: Virtualized Chat (10,000 Messages)

### What to Notice

Scroll through **10,000 chat messages** with buttery-smooth performance. Every message height is computed by Pretext in pure JavaScript before any DOM node is mounted. Only **~30 DOM nodes** exist at any given time, no matter where you scroll.

**Try the "Jump to #5000" button** — it lands exactly on message 5000. This is impossible with estimated heights because cumulative errors make the scroll position wrong. With Pretext, every message's pixel position is accurate.

### The Problem This Solves

Imagine building a chat app. Your most active group has 10,000 messages. What happens when a user opens it?

- **Render all 10,000 messages** → Phone catches fire, app crashes
- **Virtual list with estimated heights** → Scroll bar lies, jumps around, "jump to message" lands in wrong place
- **Virtual list that measures DOM on first appear** → First scroll is jittery, then it's smooth (but slow)
- **Virtual list with Pretext pre-computed heights** ✓ → First paint is correct, scroll is buttery smooth, jump-to-message works perfectly

### Key Stats (shown in header bar)

- **Messages**: 10,000 total in the chat
- **DOM nodes**: Only ~30 mounted at any time (watch this number stay tiny as you scroll)
- **Layout time**: Typically 30-50ms to compute all 10,000 positions upfront
- **Verify button**: Compares Pretext predictions vs actual DOM measurements (logs to console)

### How It Works

1. **Generate 10,000 messages** with varying lengths (50% short, 35% medium, 15% long)
2. **Compute layout once on mount** using Pretext to measure every message's height
3. **Binary search** to find which messages intersect the viewport on each scroll frame
4. **Render only visible + overscan** (600px above/below viewport)
5. **Position with `absolute`** at pre-computed pixel coordinates

All layout math happens in JavaScript. The browser just paints pre-positioned elements.

### Features

- iMessage-style aesthetic (blue bubbles for "me", gray for "them")
- Sender labels on first message in each group
- Jump to start / message #5000 / end buttons
- Highlight animation when jumping to show accuracy
- Live DOM node counter

---

## Demo 2: Virtualized Masonry Grid

### What to Notice

Scroll through **10,000 cards** with zero DOM measurements. Every card's height is computed by Pretext before render. Only visible cards exist in the DOM (typically 40-60 out of 10,000).

Open your browser's performance profiler and start a recording while scrolling. You'll see virtually no scripting time and no layout work.

### Key Metrics (shown in sticky stats bar)

- **Cards in feed**: Toggle between 1,500 / 5,000 / 10,000 cards
- **Layout time**: Total time to compute all card positions (typically <50ms for 10,000 cards)
- **DOM nodes mounted**: Only visible cards (~40-60 out of 10,000)
- **Total height of feed**: Often 400,000+ pixels for large feeds
- **Pretext measurements**: Equals card count (every card measured once)
- **DOM measurements**: Always 0 (no `getBoundingClientRect()` calls)

### Features

- **Column controls**: Switch between 2 / 3 / 4 column layouts
- **Card count controls**: Test with 1,500 / 5,000 / 10,000 cards
- **Verify accuracy**: Click to compare Pretext predictions vs actual DOM measurements
- **Custom virtualization**: No third-party libraries
- **Masonry layout**: Shortest-column algorithm with proper card distribution
- **LogRocket topic cards**: Realistic blog post titles and descriptions

### How It Works

1. **Generate cards**: Create N cards with LogRocket blog post titles and descriptions
2. **Measure with Pretext**: For each card, use `prepare()` + `layout()` to compute text height
3. **Position calculation**: Use shortest-column algorithm to determine x/y position
4. **Virtualization**: Only render cards within viewport + overscan area
5. **Absolute positioning**: Use computed x/y for pixel-perfect placement

---

## Built With

- Vite + React
- [@chenglou/pretext](https://www.npmjs.com/package/@chenglou/pretext) for text measurement

---

## Why This Matters

Traditional approaches require rendering text to the DOM to measure it, creating a performance bottleneck:

1. **Render → Measure → Adjust → Re-render** creates layout thrashing
2. **Estimated heights** cause cumulative errors and broken scroll behavior
3. **Measure-on-demand** makes the first scroll jittery

Pretext uses Canvas `measureText()` plus pure arithmetic to compute dimensions **before** any DOM operations. This unlocks:

- **Virtualized chat at any scale** (Demo 1) - 10,000+ messages with perfect scroll
- **Masonry feeds without jank** (Demo 2) - Compute all positions upfront
- **Zero layout thrashing** - No forced reflows from `getBoundingClientRect()`
- **300x faster measurements** - Canvas arithmetic vs DOM queries
- **Pixel-perfect accuracy** - Jump-to-message/card lands exactly right

Perfect for chat apps, social feeds, dashboards, or any UI where text measurement is a bottleneck.
