import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const WEBHOOK_URL = 'https://healthrocket.app.n8n.cloud/webhook/8ec404be-7f51-47c8-8faf-0d139bd4c5e9/chat';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isExpanded?: boolean;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVisualizationModal, setShowVisualizationModal] = useState(false);
  const [visualizationText, setVisualizationText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

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
    scrollViewRef.current?.scrollToEnd({ animated: true });
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

  const renderMessage = (message: Message) => {
    const isLongMessage = shouldTruncate(message.text);
    const displayText = !message.isUser && isLongMessage && !message.isExpanded
      ? getTruncatedText(message.text)
      : message.text;

    return (
      <View key={message.id} style={[
        styles.messageContainer,
        message.isUser ? styles.userMessageContainer : styles.botMessageContainer
      ]}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatar}>
            {message.isUser ? '👤' : '🚀'}
          </Text>
        </View>
        
        <View style={[
          styles.messageBubble,
          message.isUser ? styles.userBubble : styles.botBubble
        ]}>
          <Text style={styles.messageText}>{displayText}</Text>
          
          {!message.isUser && isLongMessage && (
            <TouchableOpacity
              style={styles.showMoreButton}
              onPress={() => toggleMessageExpansion(message.id)}
            >
              <Text style={styles.showMoreText}>
                {message.isExpanded ? 'Show Less' : 'Show More'}
              </Text>
            </TouchableOpacity>
          )}
          
          {!message.isUser && message.text.length > 100 && (
            <TouchableOpacity
              style={styles.visualizationButton}
              onPress={() => createVisualization(message.text)}
            >
              <Text style={styles.visualizationButtonText}>
                📊 Create Visualization
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#334155" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🚀</Text>
          </View>
          <Text style={styles.headerTitle}>Astra AI</Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Area */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.welcomeContainer}>
              <View style={styles.welcomeLogo}>
                <Text style={styles.welcomeLogoText}>🚀</Text>
              </View>
              <Text style={styles.welcomeTitle}>Welcome to Astra AI</Text>
              <Text style={styles.welcomeSubtitle}>RocketHub's Company Intelligence Agent</Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <View style={styles.avatarContainer}>
                <Text style={styles.avatar}>🚀</Text>
              </View>
              <View style={styles.loadingBubble}>
                <Text style={styles.loadingText}>Astra is thinking...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type your message to Astra..."
              placeholderTextColor="#94a3b8"
              multiline
              maxLength={1000}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || isLoading) && styles.sendButtonDisabled
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || isLoading}
            >
              <Text style={styles.sendButtonText}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Visualization Modal */}
      <Modal
        visible={showVisualizationModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVisualizationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📊 Visualization Feature</Text>
            <Text style={styles.modalDescription}>
              Visualization feature coming soon!
            </Text>
            <Text style={styles.modalPreview}>
              This would create a chart based on: {visualizationText.substring(0, 100)}...
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowVisualizationModal(false)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1e293b',
  },
  flex1: {
    flex: 1,
  },
  header: {
    backgroundColor: '#334155',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#f97316',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoEmoji: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  welcomeLogo: {
    width: 80,
    height: 80,
    backgroundColor: '#f97316',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeLogoText: {
    fontSize: 32,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  userMessageContainer: {
    flexDirection: 'row-reverse',
  },
  botMessageContainer: {
    flexDirection: 'row',
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  avatar: {
    fontSize: 16,
  },
  messageBubble: {
    maxWidth: width * 0.75,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: '#3b82f6',
  },
  botBubble: {
    backgroundColor: '#f97316',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
    color: 'white',
  },
  showMoreButton: {
    marginTop: 8,
    paddingVertical: 4,
  },
  showMoreText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  visualizationButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  visualizationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingBubble: {
    backgroundColor: '#f97316',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    maxWidth: 200,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  inputContainer: {
    backgroundColor: '#334155',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#475569',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#475569',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    color: 'white',
    maxHeight: 120,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#64748b',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalDescription: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 16,
  },
  modalPreview: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});