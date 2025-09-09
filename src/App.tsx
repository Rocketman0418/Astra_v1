import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Send, Loader2, AlertCircle, RotateCcw, Rocket, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import VisualizationPage from './components/VisualizationPage';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isExpanded?: boolean;
}

const WEBHOOK_URL = 'https://healthrocket.app.n8n.cloud/webhook/8ec404be-7f51-47c8-8faf-0d139bd4c5e9/chat';
const STORAGE_KEY = 'astra-chat-messages';
const VISUALIZATIONS_KEY = 'astra-visualizations';
const VISUALIZATION_CACHE_KEY = 'astra-visualization-cache';

function ChatInterface() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [visualizedMessages, setVisualizedMessages] = useState<Set<string>>(new Set());
  const [visualizationCache, setVisualizationCache] = useState<Map<string, string>>(new Map());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load data from localStorage
  useEffect(() => {
    loadStoredData();
  }, []);

  // Save data to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    localStorage.setItem(VISUALIZATIONS_KEY, JSON.stringify(Array.from(visualizedMessages)));
  }, [visualizedMessages]);

  useEffect(() => {
    localStorage.setItem(VISUALIZATION_CACHE_KEY, JSON.stringify(Array.from(visualizationCache.entries())));
  }, [visualizationCache]);

  const loadStoredData = () => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEY);
      const savedVisualizations = localStorage.getItem(VISUALIZATIONS_KEY);
      const savedCache = localStorage.getItem(VISUALIZATION_CACHE_KEY);
      
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
      }
      
      if (savedVisualizations) {
        const parsed = JSON.parse(savedVisualizations);
        setVisualizedMessages(new Set(parsed));
      }
      
      if (savedCache) {
        const parsed = JSON.parse(savedCache);
        setVisualizationCache(new Map(parsed));
      }
    } catch (err) {
      console.error('Failed to load stored data:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [inputText]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

    setError(null);
    setLastUserMessage(inputText.trim());

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatInput: userMessage.text })
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
      
      // Clean up the response text
      let cleanedData = data;
      if (cleanedData.startsWith('{"output":"') && cleanedData.endsWith('"}')) {
        try {
          const parsed = JSON.parse(cleanedData);
          cleanedData = parsed.output || cleanedData;
        } catch {
          // If parsing fails, use the original data
        }
      }
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: cleanedData || "I'm sorry, I didn't receive a proper response. Please try again.",
        isUser: false,
        timestamp: new Date(),
        isExpanded: false
      };
      
      setMessages(prev => [...prev, botMessage]);
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

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const retryLastMessage = () => {
    if (lastUserMessage) {
      setInputText(lastUserMessage);
      setTimeout(() => sendMessage(), 100);
    }
  };

  const toggleMessageExpansion = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isExpanded: !msg.isExpanded }
        : msg
    ));
  };

  const cacheVisualization = (messageId: string, htmlContent: string) => {
    setVisualizationCache(prev => new Map([...prev, [messageId, htmlContent]]));
    setVisualizedMessages(prev => new Set([...prev, messageId]));
  };

  const createVisualization = (messageText: string, messageId: string, type: 'quick' | 'detailed' = 'quick') => {
    const cachedVisualization = visualizationCache.get(messageId);
    
    navigate('/visualization', {
      state: {
        messageContent: messageText,
        visualizationType: type,
        cachedVisualization,
        messageId
      }
    });
  };

  const shouldTruncate = (text: string) => text.length > 300;
  const getTruncatedText = (text: string) => text.substring(0, 300) + '...';

  const formatMessage = (text: string) => {
    let cleanText = text;
    cleanText = cleanText.replace(/\\n/g, '\n');
    cleanText = cleanText.replace(/\\(\*)/g, '$1');
    return cleanText;
  };

  const renderMessage = (message: Message) => {
    const formattedText = formatMessage(message.text);
    const isLongMessage = shouldTruncate(formattedText);
    const displayText = !message.isUser && isLongMessage && !message.isExpanded
      ? getTruncatedText(formattedText)
      : formattedText;

    return (
      <div key={message.id} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`flex max-w-[85%] ${message.isUser ? 'flex-row-reverse' : 'flex-row'} items-start space-x-3`}>
          {/* Avatar */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            message.isUser ? 'bg-blue-600 ml-3' : 'bg-[#FF4500] mr-3'
          }`}>
            {message.isUser ? (
              <span className="text-white text-sm">👤</span>
            ) : (
              <Rocket className="w-4 h-4 text-white" />
            )}
          </div>

          {/* Message Content */}
          <div className={`rounded-2xl px-4 py-3 ${
            message.isUser 
              ? 'bg-blue-600 text-white' 
              : 'bg-[#FF4500] text-white'
          }`}>
            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
              {displayText}
            </div>
            
            {/* Show More/Less Button */}
            {!message.isUser && isLongMessage && (
              <button
                onClick={() => toggleMessageExpansion(message.id)}
                className="flex items-center space-x-1 mt-2 text-white/80 hover:text-white text-xs transition-colors"
              >
                {message.isExpanded ? (
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
            )}
            
            {/* Visualization Button */}
            {!message.isUser && formattedText.length > 100 && (
              <button
                onClick={() => createVisualization(formattedText, message.id)}
                className="flex items-center space-x-2 mt-3 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-medium transition-colors w-full justify-center"
              >
                <BarChart3 className="w-3 h-3" />
                <span>
                  {visualizedMessages.has(message.id) ? 'View Visualization' : 'Create Visualization'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-gray-700 px-4 sm:px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-8 h-8 bg-[#FF4500] rounded-full flex items-center justify-center">
            <Rocket className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-white text-center">
            Astra: Company Intelligence Agent
          </h1>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12 sm:py-20">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FF4500] rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">Welcome to Astra AI</h2>
              <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto">
                RocketHub's Company Intelligence Agent with AI-powered visualizations
              </p>
            </div>
          ) : (
            messages.map(renderMessage)
          )}

          {/* Loading Animation */}
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="flex items-start space-x-3 max-w-[85%]">
                <div className="w-8 h-8 bg-[#FF4500] rounded-full flex items-center justify-center flex-shrink-0">
                  <Rocket className="w-4 h-4 text-white" />
                </div>
                <div className="bg-[#FF4500] rounded-2xl px-4 py-3">
                  <div className="text-white text-sm mb-2">
                    Astra is gathering information from company meetings, documents, financials, latest news and more as needed
                  </div>
                  <div className="flex items-center space-x-1">
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                    <span className="text-white text-xs">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 sm:mx-6 mb-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-900/50 border border-red-700 rounded-lg p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-red-200 text-sm">{error}</p>
                </div>
                <button
                  onClick={retryLastMessage}
                  className="flex items-center space-x-1 bg-red-700 hover:bg-red-600 text-white px-3 py-1 rounded text-xs transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-700 bg-gradient-to-r from-[#1a1a2e] to-[#16213e] px-4 sm:px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-end space-x-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message to Astra..."
                className="w-full bg-gray-700 border border-gray-600 rounded-2xl px-4 py-3 text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-[#FF4500] focus:border-transparent text-sm leading-relaxed"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              className="w-11 h-11 bg-[#FF4500] hover:bg-[#FF6B35] disabled:bg-gray-600 disabled:cursor-not-allowed rounded-full flex items-center justify-center transition-colors flex-shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [visualizationCache, setVisualizationCache] = useState<Map<string, string>>(new Map());

  const cacheVisualization = (messageId: string, htmlContent: string) => {
    setVisualizationCache(prev => new Map([...prev, [messageId, htmlContent]]));
  };

  return (
    <Routes>
      <Route path="/" element={<ChatInterface />} />
      <Route 
        path="/visualization" 
        element={<VisualizationPage cacheVisualization={cacheVisualization} />} 
      />
    </Routes>
  );
}

export default App;