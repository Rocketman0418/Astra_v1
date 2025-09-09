import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route } from 'react-router-dom';

const WEBHOOK_URL = 'https://healthrocket.app.n8n.cloud/webhook/8ec404be-7f51-47c8-8faf-0d139bd4c5e9/chat';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isExpanded?: boolean;
}

function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVisualizationModal, setShowVisualizationModal] = useState(false);
  const [visualizationText, setVisualizationText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const toggleMessageExpansion = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isExpanded: !msg.isExpanded }
        : msg
    ));
  };

  const createVisualization = (messageText: string) => {
    setVisualizationText(messageText);
    setShowVisualizationModal(true);
  };

  const shouldTruncate = (text: string) => text.length > 300;
  const getTruncatedText = (text: string) => text.substring(0, 300) + '...';

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
          timestamp: new Date(),
          isExpanded: false
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
        timestamp: new Date(),
        isExpanded: false
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
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100%',
      maxWidth: '100%',
      backgroundColor: '#1e293b',
      color: 'white',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#334155',
        padding: '16px',
        textAlign: 'center',
        borderBottom: '1px solid #475569',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#f97316',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '16px'
          }}>
            🚀
          </div>
          <h1 style={{
            fontSize: '20px',
            fontWeight: 'bold',
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
        padding: '16px',
        maxWidth: '100%'
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              backgroundColor: '#f97316',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '32px'
            }}>
              🚀
            </div>
            <h2 style={{ fontSize: '24px', marginBottom: '12px' }}>Welcome to Astra AI</h2>
            <p style={{ color: '#94a3b8', fontSize: '16px' }}>RocketHub's Company Intelligence Agent</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              style={{
                display: 'flex',
                marginBottom: '20px',
                gap: '12px',
                maxWidth: '100%',
                flexDirection: message.isUser ? 'row-reverse' : 'row'
              }}
            >
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: '16px',
                backgroundColor: message.isUser ? '#3b82f6' : '#f97316'
              }}>
                {message.isUser ? '👤' : '🚀'}
              </div>
              <div style={{
                padding: '14px 18px',
                borderRadius: '18px',
                maxWidth: '280px',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                fontSize: '16px',
                lineHeight: '1.6',
                backgroundColor: message.isUser ? '#3b82f6' : '#f97316',
                color: 'white'
              }}>
                <div>
                  {!message.isUser && shouldTruncate(message.text) && !message.isExpanded
                    ? getTruncatedText(message.text)
                    : message.text
                  }
                </div>
                
                {!message.isUser && shouldTruncate(message.text) && (
                  <button
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontSize: '14px',
                      textDecoration: 'underline',
                      cursor: 'pointer',
                      marginTop: '8px',
                      padding: '4px 0',
                      minHeight: '32px'
                    }}
                    onClick={() => toggleMessageExpansion(message.id)}
                  >
                    {message.isExpanded ? 'Show Less' : 'Show More'}
                  </button>
                )}
                
                {!message.isUser && message.text.length > 100 && (
                  <button
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px 16px',
                      fontSize: '14px',
                      cursor: 'pointer',
                      marginTop: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      minHeight: '40px'
                    }}
                    onClick={() => createVisualization(message.text)}
                  >
                    📊 Create Visualization
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div style={{
            display: 'flex',
            marginBottom: '20px',
            gap: '12px',
            maxWidth: '100%'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: '16px',
              backgroundColor: '#f97316'
            }}>
              🚀
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 18px',
              backgroundColor: '#f97316',
              borderRadius: '18px',
              maxWidth: '200px',
              color: 'white',
              fontSize: '16px'
            }}>
              <span>Astra is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Visualization Modal */}
      {showVisualizationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#334155',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            color: 'white'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              📊 Visualization Feature
            </h3>
            <p style={{
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '16px',
              color: '#94a3b8'
            }}>
              Visualization feature coming soon!
            </p>
            <p style={{
              fontSize: '14px',
              lineHeight: '1.4',
              marginBottom: '20px',
              color: '#cbd5e1'
            }}>
              This would create a chart based on: {visualizationText.substring(0, 100)}...
            </p>
            <button
              onClick={() => setShowVisualizationModal(false)}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div style={{
        padding: '16px',
        backgroundColor: '#334155',
        borderTop: '1px solid #475569',
        flexShrink: 0
      }}>
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-end'
        }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message to Astra..."
            style={{
              flex: 1,
              padding: '14px 18px',
              borderRadius: '22px',
              border: '1px solid #64748b',
              backgroundColor: '#475569',
              color: 'white',
              fontSize: '16px',
              outline: 'none',
              resize: 'none',
              minHeight: '48px',
              maxHeight: '120px',
              fontFamily: 'inherit'
            }}
            disabled={isLoading}
            rows={1}
          />
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isLoading}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#f97316',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '18px',
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
