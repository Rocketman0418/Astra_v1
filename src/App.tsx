import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Routes, Route, BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { Send, AlertCircle, RotateCcw, Rocket, User, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import VisualizationPage from './components/VisualizationPage';

// Types
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isInitialResponse?: boolean;
}

// Constants
const WEBHOOK_URL = 'https://healthrocket.app.n8n.cloud/webhook/8ec404be-7f51-47c8-8faf-0d139bd4c5e9/chat';
const STORAGE_KEY = 'astra-chat-messages';
const VISUALIZATIONS_KEY = 'astra-visualizations';
const VISUALIZATION_CACHE_KEY = 'astra-visualization-cache';

// Custom hook for chat functionality
const useChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  const [visualizedMessages, setVisualizedMessages] = useState<Set<string>>(new Set());
  const [visualizationCache, setVisualizationCache] = useState<Map<string, string>>(new Map());

  // Load messages from session storage on mount
  useEffect(() => {
    const savedMessages = sessionStorage.getItem(STORAGE_KEY);
    const savedVisualizations = sessionStorage.getItem(VISUALIZATIONS_KEY);
    const savedCache = sessionStorage.getItem(VISUALIZATION_CACHE_KEY);
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      } catch (err) {
        console.error('Failed to load saved messages:', err);
      }
    }
    
    if (savedVisualizations) {
      try {
        const parsed = JSON.parse(savedVisualizations);
        setVisualizedMessages(new Set(parsed));
      } catch (err) {
        console.error('Failed to load saved visualizations:', err);
      }
    }
    
    if (savedCache) {
      try {
        const parsed = JSON.parse(savedCache);
        setVisualizationCache(new Map(parsed));
      } catch (err) {
        console.error('Failed to load saved visualization cache:', err);
      }
    }
  }, []);

  // Save messages to session storage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Save visualizations to session storage whenever they change
  useEffect(() => {
    sessionStorage.setItem(VISUALIZATIONS_KEY, JSON.stringify(Array.from(visualizedMessages)));
  }, [visualizedMessages]);

  // Save visualization cache to session storage whenever it changes
  useEffect(() => {
    sessionStorage.setItem(VISUALIZATION_CACHE_KEY, JSON.stringify(Array.from(visualizationCache.entries())));
  }, [visualizationCache]);

  const markMessageAsVisualized = (messageId: string) => {
    setVisualizedMessages(prev => new Set([...prev, messageId]));
  };

  const isMessageVisualized = (messageId: string) => {
    return visualizedMessages.has(messageId);
  };

  const cacheVisualization = (messageId: string, htmlContent: string) => {
    setVisualizationCache(prev => new Map([...prev, [messageId, htmlContent]]));
  };

  const getCachedVisualization = (messageId: string) => {
    return visualizationCache.get(messageId);
  };

  const sendMessage = async (messageText: string) => {
    setError(null);
    setLastUserMessage(messageText);
    
    // Add user message immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Check if API key is available
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log('API Key check:', {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        environment: import.meta.env.MODE,
        allEnvVars: Object.keys(import.meta.env)
      });
      
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatInput: messageText }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to connect to Astra. ';
        if (response.status === 500) {
          errorMessage += 'The AI service is temporarily unavailable. Please try again in a moment.';
        } else if (response.status === 404) {
          errorMessage += 'The AI service endpoint was not found.';
        } else if (response.status >= 400 && response.status < 500) {
          errorMessage += 'There was an issue with your request.';
        } else {
          errorMessage += `Server error (${response.status}). Please try again.`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.text();
      
      // Add Astra's response
      const astraMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data || "I'm sorry, I didn't receive a proper response. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, astraMessage]);
    } catch (err) {
      console.error('Failed to send message:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to connect to Astra. Please check your connection and try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const retryLastMessage = () => {
    if (lastUserMessage) {
      sendMessage(lastUserMessage);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    retryLastMessage,
    markMessageAsVisualized,
    isMessageVisualized,
    cacheVisualization,
    getCachedVisualization
  };
};

// Header Component
const Header: React.FC = () => {
  return (
    <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-gray-700 px-2 sm:px-6 py-2 sm:py-4 sticky top-0 z-50">
      <div className="flex items-center justify-between w-full">
        <img 
          src="/rockethub-logo.png" 
          alt="RocketHub Logo" 
          className="h-8 sm:h-12 w-auto flex-shrink-0"
          onError={(e) => {
            console.error('Logo failed to load:', e);
            // Hide the image if it fails to load
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="flex-1 flex items-center justify-center px-2">
          <h1 className="text-xs sm:text-xl font-bold text-white flex items-center space-x-1 sm:space-x-3">
            <div className="w-5 h-5 sm:w-8 sm:h-8 bg-[#FF4500] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-xs sm:text-lg">🚀</span>
            </div>
            <span className="bg-gradient-to-r from-[#FF4500] to-[#FF6B35] bg-clip-text text-transparent font-extrabold tracking-tight truncate max-w-[200px] sm:max-w-none">
              <span className="hidden sm:inline">Astra: Company Intelligence Agent</span>
              <span className="sm:hidden">Astra AI</span>
            </span>
          </h1>
        </div>
        <div className="w-8 sm:w-12 flex-shrink-0"></div>
      </div>
    </header>
  );
};

// Typing Indicator Component
const TypingIndicator: React.FC = () => {
  return (
    <div className="flex items-start space-x-2 sm:space-x-3 mb-4 sm:mb-6">
      <div className="w-8 h-8 rounded-full bg-[#FF4500] flex items-center justify-center flex-shrink-0">
        <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
      </div>
      <div className="max-w-[280px] sm:max-w-xs">
        <div className="bg-[#FF4500] rounded-2xl px-4 py-3">
          <div className="flex items-center space-x-1">
            <span className="text-white text-sm break-words">Astra is gathering information from the company meetings, documents, financials, latest news and more as needed</span>
            <div className="flex space-x-1 ml-2">
              <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chat Message Component
interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
  isInitialResponse?: boolean;
  messageId: string;
  hasVisualization?: boolean;
  onMarkAsVisualized?: (messageId: string) => void;
  getCachedVisualization?: (messageId: string) => string | undefined;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  message, 
  isUser, 
  timestamp, 
  isInitialResponse = false, 
  messageId, 
  hasVisualization, 
  onMarkAsVisualized, 
  getCachedVisualization 
}) => {
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatMessage = (text: string) => {
    if (!isUser) {
      let cleanText = text;
      
      cleanText = cleanText.replace(/\\n/g, '\n');
      cleanText = cleanText.replace(/\\(\*)/g, '$1');
      
      return cleanText;
    }
    return text;
  };

  const openVisualization = (type: 'quick' | 'detailed') => {
    const formattedMessage = formatMessage(message);
    
    if (onMarkAsVisualized) {
      onMarkAsVisualized(messageId);
    }
    
    const cachedVisualization = getCachedVisualization ? getCachedVisualization(messageId) : undefined;
    
    if (cachedVisualization) {
      navigate('/visualization', { 
        state: { 
          messageContent: formattedMessage,
          visualizationType: type,
          cachedVisualization: cachedVisualization,
          messageId: messageId
        } 
      });
    } else {
      navigate('/visualization', { 
        state: { 
          messageContent: formattedMessage,
          visualizationType: type,
          messageId: messageId
        } 
      });
    }
  };

  const shouldTruncate = !isUser && formatMessage(message).split('\n').length > 10;
  const messageLines = formatMessage(message).split('\n');
  // On mobile, truncate after 5 lines, on desktop after 10 lines
  const isMobile = window.innerWidth < 768;
  const truncateLimit = isMobile ? 5 : 10;
  const shouldTruncateMobile = !isUser && messageLines.length > truncateLimit;
  const displayLines = shouldTruncateMobile && !isExpanded ? messageLines.slice(0, truncateLimit) : messageLines;
  const displayMessage = displayLines.join('\n');

  return (
    <div className={`flex items-start space-x-2 sm:space-x-3 mb-3 sm:mb-6 px-2 w-full ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-blue-600' : 'bg-[#FF4500]'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        ) : (
          <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        )}
      </div>

      <div className={`max-w-[calc(100vw-100px)] sm:max-w-md lg:max-w-lg xl:max-w-xl ${isUser ? 'ml-auto' : 'mr-auto'}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser ? 'bg-blue-600 text-white' : 'bg-[#FF4500] text-white'
        }`}>
          <div className="text-base sm:text-base leading-relaxed whitespace-pre-wrap break-words">
            {displayMessage.split('\n').map((line, index, array) => {
              const formattedLine = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
              
              return (
                <span key={index}>
                  <span dangerouslySetInnerHTML={{ __html: formattedLine }} />
                  {index < array.length - 1 && <br />}
                </span>
              );
            })}
          </div>
          
          {shouldTruncateMobile && (
            <div className="mt-3 pt-2 border-t border-white/20">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors text-sm"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    <span>Show Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    <span>Show More</span>
                  </>
                )}
              </button>
            </div>
          )}
          
          {!isUser && !isInitialResponse && (
            <div className={`mt-3 pt-2 ${shouldTruncate ? '' : 'border-t border-white/20'}`}>
              <button
                onClick={() => openVisualization('quick')}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-4 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm w-full justify-center"
              >
                <BarChart3 className="w-4 h-4" />
                <span>{hasVisualization ? 'View Visualization' : 'Create Visualization'}</span>
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2 px-2">
          {formatTime(timestamp)}
        </p>
      </div>
    </div>
  );
};

// Chat Container Component
interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  isMessageVisualized: (messageId: string) => boolean;
  onMarkAsVisualized: (messageId: string) => void;
  cacheVisualization: (messageId: string, htmlContent: string) => void;
  getCachedVisualization: (messageId: string) => string | undefined;
}

const ChatContainer: React.FC<ChatContainerProps> = ({ 
  messages, 
  isLoading, 
  isMessageVisualized, 
  onMarkAsVisualized, 
  cacheVisualization, 
  getCachedVisualization 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1a1a2e] to-[#16213e] px-2 sm:px-6 py-3 sm:py-6">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 && (
          <div className="text-center py-6 sm:py-12 px-2 sm:px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FF4500] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <span className="text-2xl sm:text-3xl">🚀</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-3">Welcome to Astra AI</h2>
            <p className="text-base sm:text-lg text-gray-400 px-4">RocketHub's Company Intelligence Agent</p>
          </div>
        )}
        
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message.text}
            isUser={message.isUser}
            timestamp={message.timestamp}
            isInitialResponse={message.isInitialResponse}
            messageId={message.id}
            hasVisualization={isMessageVisualized(message.id)}
            onMarkAsVisualized={onMarkAsVisualized}
            getCachedVisualization={getCachedVisualization}
          />
        ))}
        
        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

// Message Input Component
interface MessageInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, isLoading, error, onRetry }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-gray-700 bg-[#1a1a2e] px-3 sm:px-6 py-3 sm:py-4 sticky bottom-0 z-50 safe-area-inset-bottom w-full">
      {error && (
        <div className="mb-3 flex flex-col items-start justify-between bg-red-900/20 border border-red-500/30 rounded-lg px-2 py-2 space-y-2 max-w-full">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm leading-relaxed break-words">{error}</span>
          </div>
          <button
            onClick={onRetry}
            className="flex items-center space-x-2 text-red-400 hover:text-red-300 transition-colors bg-red-900/30 px-3 py-2 rounded-lg"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Retry</span>
          </button>
        </div>
      )}
      
      <div className="flex items-end space-x-1 sm:space-x-3 w-full max-w-full">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message to Astra..."
            disabled={isLoading}
            className="w-full bg-gray-800 border border-gray-600 rounded-2xl px-2 sm:px-4 py-2 sm:py-4 text-base text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] max-h-[120px] box-border"
            rows={1}
          />
        </div>
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="w-10 h-10 sm:w-12 sm:h-12 bg-[#FF4500] rounded-full flex items-center justify-center text-white hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none flex-shrink-0"
        >
          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const { messages, isLoading, error, sendMessage, retryLastMessage, markMessageAsVisualized, isMessageVisualized, cacheVisualization, getCachedVisualization } = useChat();

  return (
    <Routes>
      <Route path="/" element={
        <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col w-full overflow-x-hidden">
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
        </div>
      } />
      <Route path="/visualization" element={<VisualizationPage cacheVisualization={cacheVisualization} />} />
    </Routes>
  );
}

export default App;