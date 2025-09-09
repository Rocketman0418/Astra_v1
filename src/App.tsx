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
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      marginBottom: '16px',
      padding: '0 16px',
      width: '100%'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        background: '#f97316',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0
      }}>
        <Rocket style={{ width: '16px', height: '16px', color: 'white' }} />
      </div>
      <div style={{
        background: '#f97316',
        borderRadius: '16px',
        padding: '12px 16px',
        color: 'white',
        maxWidth: '320px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Astra is thinking</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{
              width: '6px',
              height: '6px',
              background: 'white',
              borderRadius: '50%',
              animation: 'bounce 1.4s infinite ease-in-out both'
            }}></div>
            <div style={{
              width: '6px',
              height: '6px',
              background: 'white',
              borderRadius: '50%',
              animation: 'bounce 1.4s infinite ease-in-out both',
              animationDelay: '-0.16s'
            }}></div>
            <div style={{
              width: '6px',
              height: '6px',
              background: 'white',
              borderRadius: '50%',
              animation: 'bounce 1.4s infinite ease-in-out both',
              animationDelay: '-0.32s'
            }}></div>
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
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      marginBottom: '16px',
      padding: '0 16px',
      width: '100%',
      flexDirection: isUser ? 'row-reverse' : 'row'
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: isUser ? '#3b82f6' : '#f97316'
      }}>
        {isUser ? (
          <User style={{ width: '16px', height: '16px', color: 'white' }} />
        ) : (
          <Rocket style={{ width: '16px', height: '16px', color: 'white' }} />
        )}
      </div>

      <div style={{
        flex: 1,
        minWidth: 0,
        maxWidth: 'calc(100% - 44px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start'
      }}>
        <div style={{
          borderRadius: '16px',
          padding: '12px 16px',
          wordWrap: 'break-word',
          overflowWrap: 'break-word',
          hyphens: 'auto',
          maxWidth: isUser ? '280px' : '320px',
          background: isUser ? '#3b82f6' : '#f97316',
          color: 'white'
        }}>
          <div style={{
            fontSize: '14px',
            lineHeight: '1.5',
            wordBreak: 'break-word'
          }}>
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
            <div style={{
              marginTop: '8px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  color: 'rgba(255, 255, 255, 0.8)',
                  background: 'none',
                  border: 'none',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp style={{ width: '12px', height: '12px' }} />
                    <span>Show Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown style={{ width: '12px', height: '12px' }} />
                    <span>Show More</span>
                  </>
                )}
              </button>
            </div>
          )}
          
          {!isUser && !isInitialResponse && (
            <div style={{
              marginTop: '12px',
              paddingTop: '8px',
              borderTop: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <button
                onClick={() => openVisualization('quick')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  fontWeight: '500',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '12px',
                  width: '100%',
                  cursor: 'pointer'
                }}
              >
                <BarChart3 style={{ width: '12px', height: '12px' }} />
                <span>{hasVisualization ? 'View Chart' : 'Create Chart'}</span>
              </button>
            </div>
          )}
        </div>
        <p style={{
          fontSize: '11px',
          color: '#64748b',
          marginTop: '4px',
          padding: '0 8px'
        }}>
          {formatTime(timestamp)}
        </p>
      </div>
    </div>
  );
};

// Main App Component
function App() {
  const { messages, isLoading, error, sendMessage, retryLastMessage, markMessageAsVisualized, isMessageVisualized, cacheVisualization, getCachedVisualization } = useChat();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSend = () => {
    if (message.trim() && !isLoading) {
      sendMessage(message.trim());
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
    <Routes>
      <Route path="/" element={
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100%',
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          {/* Simple Header */}
          <header style={{
            background: '#1e293b',
            borderBottom: '1px solid #334155',
            padding: '12px 16px',
            position: 'sticky',
            top: 0,
            zIndex: 50,
            width: '100%'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                background: '#f97316',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px'
              }}>
                🚀
              </div>
              <h1 style={{
                fontSize: '16px',
                fontWeight: '700',
                color: 'white',
                margin: 0
              }}>
                Astra AI
              </h1>
            </div>
          </header>
          
          {/* Chat Area */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            width: '100%'
          }}>
            <div style={{
              padding: '16px 0',
              width: '100%'
            }}>
              {messages.length === 0 && (
                <div style={{
                  textAlign: 'center',
                  padding: '48px 16px',
                  width: '100%'
                }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: '#f97316',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: '32px'
                  }}>
                    🚀
                  </div>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    color: 'white',
                    marginBottom: '8px'
                  }}>
                    Welcome to Astra AI
                  </h2>
                  <p style={{
                    color: '#94a3b8',
                    fontSize: '14px'
                  }}>
                    RocketHub's Company Intelligence Agent
                  </p>
                </div>
              )}
              
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg.text}
                  isUser={msg.isUser}
                  timestamp={msg.timestamp}
                  isInitialResponse={msg.isInitialResponse}
                  messageId={msg.id}
                  hasVisualization={isMessageVisualized(msg.id)}
                  onMarkAsVisualized={markMessageAsVisualized}
                  getCachedVisualization={getCachedVisualization}
                />
              ))}
              
              {isLoading && <TypingIndicator />}
              
              <div ref={messagesEndRef} />
            </div>
          </div>
          
          {/* Input Area */}
          <div style={{
            borderTop: '1px solid #334155',
            background: '#1e293b',
            padding: '16px',
            position: 'sticky',
            bottom: 0,
            zIndex: 50,
            width: '100%'
          }}>
            {error && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '12px',
                width: '100%'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#ef4444',
                  fontSize: '14px',
                  marginBottom: '8px'
                }}>
                  <AlertCircle style={{ width: '16px', height: '16px' }} />
                  <span>{error}</span>
                </div>
                <button 
                  onClick={retryLastMessage}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#ef4444',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <RotateCcw style={{ width: '16px', height: '16px' }} />
                  <span>Retry</span>
                </button>
              </div>
            )}
            
            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              gap: '12px',
              width: '100%'
            }}>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message to Astra..."
                disabled={isLoading}
                style={{
                  flex: 1,
                  background: '#334155',
                  border: '1px solid #475569',
                  borderRadius: '16px',
                  padding: '12px 16px',
                  color: 'white',
                  fontSize: '16px',
                  resize: 'none',
                  outline: 'none',
                  minHeight: '44px',
                  maxHeight: '120px',
                  width: '100%',
                  boxSizing: 'border-box'
                }}
                rows={1}
              />
              
              <button
                onClick={handleSend}
                disabled={!message.trim() || isLoading}
                style={{
                  width: '44px',
                  height: '44px',
                  background: message.trim() && !isLoading ? '#f97316' : '#6b7280',
                  border: 'none',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  cursor: message.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  flexShrink: 0
                }}
              >
                <Send style={{ width: '20px', height: '20px' }} />
              </button>
            </div>
          </div>
        </div>
      } />
      <Route path="/visualization" element={<VisualizationPage cacheVisualization={cacheVisualization} />} />
    </Routes>
  );
}

export default App;