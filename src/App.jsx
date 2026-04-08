import { useState } from 'react';
import HomePage from './HomePage';
import ChatDemo from './ChatDemo';
import MasonryDemo from './MasonryDemo';
import TweetComposer from './TweetComposer';

function App() {
  const [currentView, setCurrentView] = useState('home');

  if (currentView === 'chat') {
    return <ChatDemo onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'masonry') {
    return <MasonryDemo onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'tweet') {
    return <TweetComposer onBack={() => setCurrentView('home')} />;
  }

  return <HomePage onNavigate={setCurrentView} />;
}

export default App;
