import React, { useState, KeyboardEvent } from 'react';
import { Send, AlertCircle, RotateCcw } from 'lucide-react';

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
    <>
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
            onClick={onRetry}
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
      
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', width: '100%' }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message to Astra..."
          disabled={isLoading}
          className="mobile-textarea-force"
          rows={1}
        />
        
        <button
          onClick={handleSend}
          disabled={!message.trim() || isLoading}
          className="mobile-send-force"
        >
          <Send style={{ width: '20px', height: '20px' }} />
        </button>
      </div>
    </>
  );
};

export default MessageInput;