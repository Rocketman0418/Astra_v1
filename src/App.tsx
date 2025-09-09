import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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

// Typing Indicator Component
const TypingIndicator: React.FC = () => {
  return (
    <div className="message-container">
      <div className="message-avatar">
        <Rocket className="w-4 h-4 text-white" />
      </div>
      <div className="message-bubble astra-bubble">
        <div className="typing-indicator">
          <span>Astra is thinking</span>
          <div className="typing-dots">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
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

  const messageLines = formatMessage(message).split('\n');
  const shouldTruncate = !isUser && messageLines.length > 3;
  const displayLines = shouldTruncate && !isExpanded ? messageLines.slice(0, 3) : messageLines;
  const displayMessage = displayLines.join('\n');

  return (
    <div className={`message-container ${isUser ? 'user-message' : 'astra-message'}`}>
      <div className="message-avatar">
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Rocket className="w-4 h-4 text-white" />
        )}
      </div>

      <div className="message-content">
        <div className={`message-bubble ${isUser ? 'user-bubble' : 'astra-bubble'}`}>
          <div className="message-text">
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
          
          {shouldTruncate && (
            <div className="message-expand">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="expand-button"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Show Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Show More</span>
                  </>
                )}
              </button>
            </div>
          )}
          
          {!isUser && !isInitialResponse && (
            <div className="message-actions">
              <button
                onClick={() => openVisualization('quick')}
                className="chart-button"
              >
                <BarChart3 className="w-3 h-3" />
                <span>{hasVisualization ? 'View Chart' : 'Create Chart'}</span>
              </button>
            </div>
          )}
        </div>
        <p className="message-time">
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
    <div className="chat-container">
      <div className="messages-area">
        {messages.length === 0 && (
          <div className="welcome-screen">
            <div className="welcome-icon">
              <span>🚀</span>
            </div>
            <h2>Welcome to Astra AI</h2>
            <p>RocketHub's Company Intelligence Agent</p>
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
    <div className="input-area">
      {error && (
        <div className="error-message">
          <div className="error-content">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={onRetry} className="retry-button">
            <RotateCcw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      )}
      
      <div className="input-container">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message to Astra..."
          disabled={isLoading}
          className="message-input"
          rows={1}
        />
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="send-button"
        >
          <Send className="w-5 h-5" />
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
        <div className="app" style={{display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', overflowX: 'hidden'}}>
          <header className="mobile-header-force">
            <div className="mobile-header-content-force">
              <div className="mobile-logo-force">
                <span>🚀</span>
              </div>
              <h1 className="mobile-title-force">Astra AI</h1>
            </div>
          </header>
          
          <div className="mobile-chat-force">
            {messages.length === 0 && (
              <div className="mobile-welcome-force">
                <div className="mobile-welcome-icon-force">
                  <span>🚀</span>
                </div>
                <h2 className="mobile-welcome-title-force">Welcome to Astra AI</h2>
                <p className="mobile-welcome-subtitle-force">RocketHub's Company Intelligence Agent</p>
              </div>
            )}
            
            <ChatContainer 
              messages={messages} 
              isLoading={isLoading}
              isMessageVisualized={isMessageVisualized}
              onMarkAsVisualized={markMessageAsVisualized}
              cacheVisualization={cacheVisualization}
              getCachedVisualization={getCachedVisualization}
            />
          </div>
          
          <div className="mobile-input-force">
            <MessageInput 
              onSendMessage={sendMessage}
              isLoading={isLoading}
              error={error}
              onRetry={retryLastMessage}
            />
          </div>
        </div>
      } />
      <Route path="/visualization" element={<VisualizationPage cacheVisualization={cacheVisualization} />} />
    </Routes>
  );
}

export default App;