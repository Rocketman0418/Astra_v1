import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Routes, Route, BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { Send, AlertCircle, RotateCcw, Rocket, User, BarChart3, ChevronDown, ChevronUp, ArrowLeft, Loader2, Download, X } from 'lucide-react';

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
    <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-gray-700 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-50">
      <div className="flex items-center space-x-2 sm:space-x-3">
        <img 
          src="/RocketHub Logo Alt 1.png" 
          alt="RocketHub Logo" 
          className="h-10 sm:h-14 w-auto flex-shrink-0"
        />
        <div className="flex-1 text-center">
          <h1 className="text-sm sm:text-xl font-bold text-white flex items-center justify-center space-x-2 sm:space-x-3">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#FF4500] rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-sm sm:text-lg">🚀</span>
            </div>
            <span className="bg-gradient-to-r from-[#FF4500] to-[#FF6B35] bg-clip-text text-transparent font-extrabold tracking-wide truncate">
              Astra: Company Intelligence Agent
            </span>
          </h1>
        </div>
        <div className="w-10 sm:w-14 flex-shrink-0"></div>
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
  const displayLines = shouldTruncate && !isExpanded ? messageLines.slice(0, 10) : messageLines;
  const displayMessage = displayLines.join('\n');

  return (
    <div className={`flex items-start space-x-2 sm:space-x-3 mb-4 sm:mb-6 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
        isUser ? 'bg-blue-600' : 'bg-[#FF4500]'
      }`}>
        {isUser ? (
          <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        ) : (
          <Rocket className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        )}
      </div>

      <div className={`max-w-[280px] sm:max-w-md lg:max-w-lg xl:max-w-xl ${isUser ? 'ml-auto' : 'mr-auto'}`}>
        <div className={`rounded-2xl px-4 py-3 ${
          isUser ? 'bg-blue-600 text-white' : 'bg-[#FF4500] text-white'
        }`}>
          <div className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap break-words">
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
            <div className="mt-2 sm:mt-3 pt-2 border-t border-white/20">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center space-x-1 sm:space-x-2 text-white/80 hover:text-white transition-colors text-sm"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Show Less</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span>Show More</span>
                  </>
                )}
              </button>
            </div>
          )}
          
          {!isUser && !isInitialResponse && (
            <div className={`mt-2 sm:mt-3 pt-2 ${shouldTruncate ? '' : 'border-t border-white/20'}`}>
              <button
                onClick={() => openVisualization('quick')}
                className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium px-2 sm:px-3 py-2 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl text-sm w-full sm:w-auto justify-center"
              >
                <BarChart3 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span>{hasVisualization ? 'View Visualization' : 'Create Visualization'}</span>
              </button>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-1 px-1 sm:px-2">
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
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#1a1a2e] to-[#16213e] px-3 sm:px-6 py-4 sm:py-6">
      <div className="max-w-4xl mx-auto">
        {messages.length === 0 && (
          <div className="text-center py-8 sm:py-12 px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FF4500] rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-xl sm:text-2xl">🚀</span>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-white mb-2">Welcome to Astra AI</h2>
            <p className="text-sm sm:text-base text-gray-400">RocketHub's Company Intelligence Agent</p>
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
    <div className="border-t border-gray-700 bg-[#1a1a2e] px-3 sm:px-6 py-3 sm:py-4 sticky bottom-0 z-50">
      {error && (
        <div className="mb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between bg-red-900/20 border border-red-500/30 rounded-lg px-3 sm:px-4 py-2 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
          <button
            onClick={onRetry}
            className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm">Retry</span>
          </button>
        </div>
      )}
      
      <div className="flex items-end space-x-2 sm:space-x-3">
        <div className="flex-1 relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message to Astra..."
            disabled={isLoading}
            className="w-full bg-gray-800 border border-gray-600 rounded-2xl px-3 sm:px-4 py-3 pr-12 text-sm sm:text-base text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            rows={1}
            style={{ minHeight: '44px', maxHeight: '100px' }}
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

// Simple Visualization Page
const VisualizationPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visualizationHTML, setVisualizationHTML] = useState<string>('');

  const messageContent = location.state?.messageContent || '';

  useEffect(() => {
    if (!messageContent) {
      navigate('/');
      return;
    }

    const generateVisualization = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Comprehensive API key debugging
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        
        console.log('=== API KEY DEBUG INFO ===');
        console.log('Raw API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined');
        console.log('API Key exists:', !!apiKey);
        console.log('API Key length:', apiKey ? apiKey.length : 0);
        console.log('API Key type:', typeof apiKey);
        console.log('Environment mode:', import.meta.env.MODE);
        console.log('All env vars:', Object.keys(import.meta.env));
        console.log('Vite env vars:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
        console.log('==========================');
        
        if (apiKey && apiKey.trim() !== '' && apiKey !== 'undefined') {
          console.log('✅ API key found, attempting Gemini API call...');
          
          try {
            const prompt = generateQuickVisualizationPrompt(messageContent);
            console.log('Generated prompt length:', prompt.length);
            
            const response = await callGeminiAPI(prompt, apiKey);
            console.log('✅ Gemini API call successful');
            console.log('Response length:', response.length);
            
            setVisualizationHTML(response);
            return;
          } catch (apiError) {
            console.error('❌ Gemini API call failed:', apiError);
            setError(`API Error: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
          }
        } else {
          console.log('❌ No valid API key found, using fallback');
          setError('API key not configured or invalid');
        }
        
        // Use fallback visualization
        console.log('Using fallback visualization');
        const fallbackHTML = generateFallbackVisualization(messageContent);
        setVisualizationHTML(fallbackHTML);
        
      } catch (error) {
        console.error('❌ Visualization generation failed:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        
        // Final fallback
        const fallbackHTML = generateFallbackVisualization(messageContent);
        setVisualizationHTML(fallbackHTML);
      } finally {
        setIsLoading(false);
      }
    };

    // Generate a simple fallback visualization
    const generateFallbackVisualization = (content: string): string => {
      const lines = content.split('\n').filter(line => line.trim());
      const words = content.split(/\s+/).filter(w => w.trim());
      
      return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Content Summary</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 100vh;
            padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px 0;
            border-bottom: 2px solid #FF4500;
        }
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            background: linear-gradient(45deg, #FF4500, #FF6B35);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .content-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            border: 1px solid rgba(255, 69, 0, 0.3);
            backdrop-filter: blur(10px);
        }
        .content-text {
            line-height: 1.8;
            font-size: 1.1rem;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .stat-card {
            background: rgba(255, 69, 0, 0.1);
            border: 1px solid #FF4500;
            border-radius: 10px;
            padding: 20px;
            text-align: center;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #FF4500;
            margin-bottom: 5px;
        }
        .stat-label {
            font-size: 0.9rem;
            opacity: 0.8;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Content Summary</h1>
            <p>RocketHub Intelligence Dashboard</p>
        </div>
        
        <div class="content-card">
            <h2 style="color: #FF4500; margin-bottom: 20px;">📄 Full Content</h2>
            <div class="content-text">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${words.length}</div>
                <div class="stat-label">Words</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${lines.length}</div>
                <div class="stat-label">Lines</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${content.length}</div>
                <div class="stat-label">Characters</div>
            </div>
        </div>
    </div>
</body>
</html>`;
    };

    // Generate visualization with proper async handling
    generateVisualization();
  }, [messageContent, navigate]);

  const handleBack = () => {
    navigate('/');
  };

  const handleRetry = () => {
    // Retry visualization generation
    const generateVisualization = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        
        if (apiKey && apiKey.trim() !== '' && apiKey !== 'undefined') {
          const prompt = generateQuickVisualizationPrompt(messageContent);
          const response = await callGeminiAPI(prompt, apiKey);
          setVisualizationHTML(response);
        } else {
          const fallbackHTML = generateFallbackVisualization(messageContent);
          setVisualizationHTML(fallbackHTML);
        }
      } catch (error) {
        console.error('Retry failed:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
        const fallbackHTML = generateFallbackVisualization(messageContent);
        setVisualizationHTML(fallbackHTML);
      } finally {
        setIsLoading(false);
      }
    };
    
    generateVisualization();
  };

  // Helper function to call Gemini API
  const callGeminiAPI = async (prompt: string, apiKey: string): Promise<string> => {
    console.log('Making API call to Gemini...');
    console.log('API Key prefix:', apiKey.substring(0, 10));
    console.log('Prompt length:', prompt.length);
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
        }
      })
    });

    console.log('API Response status:', response.status);
    console.log('API Response ok:', response.ok);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error response:', errorText);
      throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('API Response data keys:', Object.keys(data));
    
    if (data.error) {
      console.error('API returned error:', data.error);
      throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
    }
    
    if (!data.candidates || data.candidates.length === 0) {
      console.error('No candidates in response:', data);
      throw new Error('No candidates returned from Gemini API');
    }
    
    const candidate = data.candidates[0];
    console.log('Candidate finish reason:', candidate.finishReason);
    
    if (candidate.finishReason === 'SAFETY') {
      throw new Error('Content was blocked by Gemini safety filters');
    }
    
    if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
      console.error('Invalid candidate structure:', candidate);
      throw new Error('Invalid response structure from Gemini API');
    }

    console.log('✅ API call successful, returning content');
    return candidate.content.parts[0].text;
  };

  // Generate visualization prompt
  const generateQuickVisualizationPrompt = (content: string) => {
    return `Create a complete, self-contained HTML visualization dashboard for this business content. The visualization should be professional, interactive, and tailored to the specific content type.

Content to visualize:
${content}

Requirements:
1. Generate a complete HTML document with <!DOCTYPE html>, <html>, <head>, and <body> tags
2. Include embedded CSS in <style> tags and JavaScript in <script> tags - NO external dependencies
3. Use a full viewport layout with min-height: 100vh and proper body styling
4. Create actual data visualizations using HTML5 Canvas, SVG, or CSS-based charts
5. Extract key metrics from the content and create realistic sample data if needed
6. Use RocketHub branding: orange #FF4500 primary color, dark gradient backgrounds from #1a1a2e to #16213e
7. Include a prominent header with rocket emoji 🚀 and descriptive title
8. Create metric cards with large numbers, labels, and visual indicators
9. Add progress bars, bar charts, or simple visualizations using CSS and HTML
10. Use white text on dark backgrounds for readability
11. Make it responsive with proper padding, margins, and flexbox layouts
12. Include hover effects and smooth transitions
13. Ensure all text is clearly visible with proper contrast
14. Use modern CSS with border-radius, box-shadow, and gradients
15. Create realistic data points based on the content context
16. Make the layout fill the entire viewport properly

Return ONLY the complete HTML document, no explanations or markdown formatting.`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#FF4500] rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Building Your Visualization
            </h2>
            <p className="text-sm sm:text-base text-gray-400 mb-4">
              Astra is analyzing your data and creating a custom dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col">
        <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-gray-700 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-50">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img 
              src="/RocketHub Logo Alt 1.png" 
              alt="RocketHub Logo" 
              className="h-10 sm:h-14 w-auto flex-shrink-0"
            />
            <div className="flex-1 text-center">
              <h1 className="text-sm sm:text-xl font-bold text-white flex items-center justify-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#FF4500] rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm sm:text-lg">🚀</span>
                </div>
                <span className="bg-gradient-to-r from-[#FF4500] to-[#FF6B35] bg-clip-text text-transparent font-extrabold tracking-wide truncate">
                  Astra: Company Intelligence Agent
                </span>
              </h1>
            </div>
            <div className="w-10 sm:w-14 flex justify-end flex-shrink-0">
              <button
                onClick={handleBack}
                className="flex items-center space-x-1 sm:space-x-2 text-gray-300 hover:text-white transition-colors px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-700 text-sm"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <span className="text-xl sm:text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Visualization Error</h2>
            <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-[#FF4500] text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-[#EA580C] transition-colors text-sm sm:text-base"
              >
                Try Again
              </button>
              <button
                onClick={handleBack}
                className="w-full bg-gray-700 text-white px-4 sm:px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base"
              >
                Back to Chat
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col">
      <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-gray-700 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-50">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <img 
            src="/RocketHub Logo Alt 1.png" 
            alt="RocketHub Logo" 
            className="h-10 sm:h-14 w-auto flex-shrink-0"
          />
          <div className="flex-1 text-center">
            <h1 className="text-sm sm:text-xl font-bold text-white flex items-center justify-center space-x-2 sm:space-x-3">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#FF4500] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-sm sm:text-lg">🚀</span>
              </div>
              <span className="bg-gradient-to-r from-[#FF4500] to-[#FF6B35] bg-clip-text text-transparent font-extrabold tracking-wide truncate">
                Astra: Company Intelligence Agent
              </span>
            </h1>
          </div>
          <div className="w-10 sm:w-14 flex justify-end flex-shrink-0">
            <button
              onClick={handleBack}
              className="flex items-center space-x-1 sm:space-x-2 text-gray-300 hover:text-white transition-colors px-2 sm:px-3 py-2 rounded-lg hover:bg-gray-700 text-sm"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
        {visualizationHTML ? (
          <iframe
            srcDoc={visualizationHTML}
            className="w-full border-0 bg-transparent"
            title="AI Generated Visualization"
            sandbox="allow-scripts allow-same-origin"
            style={{ 
              minHeight: '100%',
              height: 'calc(100vh - 70px)',
              display: 'block'
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-xl sm:text-2xl">⚠️</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">No Visualization Content</h2>
              <p className="text-sm sm:text-base text-gray-400">The AI did not generate any visualization content.</p>
            </div>
          </div>
        )}
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
        </div>
      } />
      <Route path="/visualization" element={<VisualizationPage />} />
    </Routes>
  );
}

export default App;