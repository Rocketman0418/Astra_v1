import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import ChatContainer from './components/ChatContainer';
import MessageInput from './components/MessageInput';
import VisualizationPage from './components/VisualizationPage';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { useChat } from './hooks/useChat';

function App() {
  const { messages, isLoading, error, sendMessage, retryLastMessage, markMessageAsVisualized, isMessageVisualized, cacheVisualization, getCachedVisualization } = useChat();

  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col pb-16 sm:pb-20">
          <Header />
          <ChatContainer 
            messages={messages} 
            isLoading={isLoading}
            isMessageVisualized={isMessageVisualized}
            onMarkAsVisualized={markMessageAsVisualized}
            cacheVisualization={cacheVisualization}
            getCachedVisualization={getCachedVisualization}
          />
          <MessageInput 
            onSendMessage={sendMessage}
            isLoading={isLoading}
            error={error}
            onRetry={retryLastMessage}
          />
          <PWAInstallPrompt />
        </div>
      } />
      <Route path="/visualization" element={<VisualizationPage cacheVisualization={cacheVisualization} />} />
    </Routes>
  );
}

export default App;