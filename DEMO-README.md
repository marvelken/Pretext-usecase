# Pretext Chat Bubble Demo

This demo showcases the power of [@chenglou/pretext](https://github.com/chenglou/pretext) for optimal text layout in React applications.

## What You're Seeing

The demo displays two side-by-side chat interfaces:

### Left Side: CSS-Only Approach (Before)
- Uses standard CSS: `max-width: 320px` and `width: fit-content`
- Text wraps naturally, but can create orphaned words
- Bubbles often stretch to max width with wasted space
- Example: "Hey, are you coming to the event tonight? I heard it's going to be really fun 🎉"
  - The emoji sits alone on the last line with ~200px of empty space

### Right Side: Pretext-Powered (After)
- Uses Pretext's text measurement engine
- Binary search finds the optimal width for balanced lines
- No orphaned words, no wasted space
- Same message now renders in a perfectly tight bubble with balanced lines

## How It Works

The `PretextBubble` component:

1. **Prepares the text** using `prepareWithSegments()` - analyzes the text once
2. **Calculates target line count** at max width using `layout()`
3. **Binary search** to find the tightest width that maintains the same line count
4. **Sets optimal width** as inline style

```javascript
const prepared = prepareWithSegments(message, font);
const { lineCount: targetLines } = layout(prepared, maxWidth, lineHeight);

// Binary search for tightest width
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
```

## Performance

- Text preparation: ~19ms for 500 texts (one-time)
- Layout calculations: ~0.09ms each (very fast!)
- Binary search typically takes 8-10 iterations
- Total time per bubble: < 1ms

## Running the Demo

```bash
npm install
npm run dev
```

Visit http://localhost:5173/ to see the comparison.

## Key Benefits

✅ **No DOM manipulation** - All calculations in pure JavaScript
✅ **Sub-millisecond performance** - Binary search is extremely fast
✅ **Perfect text wrapping** - No orphaned words or wasted space
✅ **Works with all languages** - Supports emojis, RTL text, etc.
✅ **Production ready** - Published on npm as `@chenglou/pretext`

## Try It Yourself

Type your own messages in the input field and see how Pretext optimizes them in real-time!

## Learn More

- [Pretext GitHub](https://github.com/chenglou/pretext)
- [Live Demos](https://chenglou.me/pretext)
- [npm Package](https://www.npmjs.com/package/@chenglou/pretext)
