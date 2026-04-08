import { useRef, useEffect, useState } from 'react';

function MeasuredCSSBubble({ message, isMine, showMeasurements }) {
  const bubbleRef = useRef(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (bubbleRef.current) {
      setWidth(Math.round(bubbleRef.current.offsetWidth));
    }
  }, [message]);

  return (
    <div className="bubble-wrapper">
      <div ref={bubbleRef} className={`bubble css-bubble ${isMine ? 'mine' : 'theirs'}`}>
        {message}
      </div>
      {showMeasurements && (
        <div className={`measurement ${isMine ? 'mine' : 'theirs'}`}>
          {width}px
        </div>
      )}
    </div>
  );
}

export default MeasuredCSSBubble;
