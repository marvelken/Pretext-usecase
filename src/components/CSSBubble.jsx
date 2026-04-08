function CSSBubble({ message, isMine }) {
  return (
    <div className={`bubble css-bubble ${isMine ? 'mine' : 'theirs'}`}>
      {message}
    </div>
  );
}

export default CSSBubble;
