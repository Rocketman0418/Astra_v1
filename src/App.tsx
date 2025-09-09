import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';

// Simple mobile-first app with no external dependencies
const WEBHOOK_URL = 'https://healthrocket.app.n8n.cloud/webhook/8ec404be-7f51-47c8-8faf-0d139bd4c5e9/chat';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Inline styles for mobile-first design
const styles = {
  app: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100vh',
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#1e293b',
    color: 'white',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    overflow: 'hidden'
  },
  header: {
    backgroundColor: '#334155',
    padding: '12px',
    textAlign: 'center' as const,
    borderBottom: '1px solid #475569',
    flexShrink: 0
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  },
  logo: {
    width: '24px',
    height: '24px',
    backgroundColor: '#f97316',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px'
  },
  title: {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: 0
  },
  chatArea: {
    flex: 1,
    overflowY: 'auto' as const,
    padding: '16px',
    maxWidth: '100%'
  },
  welcome: {
    textAlign: 'center' as const,
    padding: '40px 20px'
  },
  welcomeIcon: {
    width: '60px',
    height: '60px',
    backgroundColor: '#f97316',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
    fontSize: '24px'
  },
  message: {
    display: 'flex',
    marginBottom: '16px',
    gap: '8px',
    maxWidth: '100%'
  },
  userMessage: {
    flexDirection: 'row-reverse' as const
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '14px'
  },
  userAvatar: {
    backgroundColor: '#3b82f6'
  },
  botAvatar: {
    backgroundColor: '#f97316'
  },
  bubble: {
    padding: '12px 16px',
    borderRadius: '16px',
    maxWidth: '250px',
    wordWrap: 'break-word' as const,
    fontSize: '14px',
    lineHeight: '1.4'
  },
  userBubble: {
    backgroundColor: '#3b82f6',
    color: 'white'
  },
  botBubble: {
    backgroundColor: '#f97316',
    color: 'white'
  },
  inputArea: {
    padding: '16px',
    backgroundColor: '#334155',
    borderTop: '1px solid #475569',
    flexShrink: 0
  },
  inputContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'flex-end'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '20px',
    border: '1px solid #64748b',
    backgroundColor: '#475569',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
    resize: 'none' as const,
    minHeight: '44px',
    maxHeight: '100px'
  },
  sendButton: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    border: 'none',
    backgroundColor: '#f97316',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '16px'
  },
  typing: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    backgroundColor: '#f97316',
    borderRadius: '16px',
    maxWidth: '200px',
    color: 'white'
  }
};

function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;

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
        body: JSON.stringify({ chatInput: inputText.trim() })
      });

      if (response.ok) {
        const data = await response.text();
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data || "I'm sorry, I didn't receive a proper response.",
          isUser: false,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting. Please try again.",
        isUser: false,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>🚀</div>
          <h1 style={styles.title}>Astra AI</h1>
        </div>
      </header>

      {/* Chat Area */}
      <div style={styles.chatArea}>
        {messages.length === 0 ? (
          <div style={styles.welcome}>
            <div style={styles.welcomeIcon}>🚀</div>
            <h2 style={{ fontSize: '20px', marginBottom: '8px' }}>Welcome to Astra AI</h2>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>RocketHub's Company Intelligence Agent</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              style={{
                ...styles.message,
                ...(message.isUser ? styles.userMessage : {})
              }}
            >
              <div style={{
                ...styles.avatar,
                ...(message.isUser ? styles.userAvatar : styles.botAvatar)
              }}>
                {message.isUser ? '👤' : '🚀'}
              </div>
              <div style={{
                ...styles.bubble,
                ...(message.isUser ? styles.userBubble : styles.botBubble)
              }}>
                {message.text}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div style={styles.message}>
            <div style={styles.botAvatar}>🚀</div>
            <div style={styles.typing}>
              <span>Astra is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        <div style={styles.inputContainer}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message to Astra..."
            style={styles.input}
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isLoading}
            style={{
              ...styles.sendButton,
              opacity: (!inputText.trim() || isLoading) ? 0.5 : 1
            }}
          >
            ➤
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatApp />} />
    </Routes>
  );
}

export default App;