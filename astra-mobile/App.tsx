import React, { useState, useEffect, useRef, KeyboardEvent } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const WEBHOOK_URL = 'https://healthrocket.app.n8n.cloud/webhook/8ec404be-7f51-47c8-8faf-0d139bd4c5e9/chat';
const STORAGE_KEY = 'astra-chat-messages';
const VISUALIZATIONS_KEY = 'astra-visualizations';
const VISUALIZATION_CACHE_KEY = 'astra-visualization-cache';

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
  const [error, setError] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState('');
  const [visualizedMessages, setVisualizedMessages] = useState<Set<string>>(new Set());
  const [visualizationCache, setVisualizationCache] = useState<Map<string, string>>(new Map());
  
  // Visualization modal states
  const [showVisualizationModal, setShowVisualizationModal] = useState(false);
  const [currentVisualization, setCurrentVisualization] = useState<string>('');
  const [isGeneratingVisualization, setIsGeneratingVisualization] = useState(false);
  const [visualizationError, setVisualizationError] = useState<string | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Load data from AsyncStorage
  useEffect(() => {
    loadStoredData();
  }, []);

  // Save data to AsyncStorage
  useEffect(() => {
    if (messages.length > 0) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  useEffect(() => {
    AsyncStorage.setItem(VISUALIZATIONS_KEY, JSON.stringify(Array.from(visualizedMessages)));
  }, [visualizedMessages]);

  useEffect(() => {
    AsyncStorage.setItem(VISUALIZATION_CACHE_KEY, JSON.stringify(Array.from(visualizationCache.entries())));
  }, [visualizationCache]);

  const loadStoredData = async () => {
    try {
      const savedMessages = await AsyncStorage.getItem(STORAGE_KEY);
      const savedVisualizations = await AsyncStorage.getItem(VISUALIZATIONS_KEY);
      const savedCache = await AsyncStorage.getItem(VISUALIZATION_CACHE_KEY);
      
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
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

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
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data || "I'm sorry, I didn't receive a proper response. Please try again.",
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

  const generateVisualization = async (content: string) => {
    // Note: In a real app, you'd need to implement a backend service for Gemini API calls
    // since React Native can't directly call external APIs with API keys for security reasons
    
    const mockVisualizationHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Visualization</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background: #f5f5f5; 
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
        }
        .chart-container {
            position: relative;
            height: 400px;
            margin: 20px 0;
        }
        h1 { color: #333; text-align: center; }
        .metric { 
            display: inline-block; 
            margin: 10px; 
            padding: 15px; 
            background: #FF4500; 
            color: white; 
            border-radius: 8px; 
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 RocketHub Data Analysis</h1>
        <div class="metric">
            <h3>Revenue Growth</h3>
            <p>39x Increase</p>
        </div>
        <div class="metric">
            <h3>Projected Revenue</h3>
            <p>$195M</p>
        </div>
        <div class="metric">
            <h3>Time Frame</h3>
            <p>5 Years</p>
        </div>
        
        <div class="chart-container">
            <canvas id="myChart"></canvas>
        </div>
        
        <script>
            const ctx = document.getElementById('myChart').getContext('2d');
            const myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
                    datasets: [{
                        label: 'Revenue (Millions)',
                        data: [5, 25, 65, 125, 195],
                        borderColor: '#FF4500',
                        backgroundColor: 'rgba(255, 69, 0, 0.1)',
                        borderWidth: 3,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Revenue ($M)'
                            }
                        }
                    },
                    plugins: {
                        title: {
                            display: true,
                            text: 'RocketHub Revenue Projection'
                        }
                    }
                }
            });
        </script>
    </div>
</body>
</html>`;

    return mockVisualizationHtml;
  };

  const createVisualization = async (messageText: string, messageId: string) => {
    setVisualizationError(null);
    
    // Check cache first
    const cached = visualizationCache.get(messageId);
    if (cached) {
      setCurrentVisualization(cached);
      setShowVisualizationModal(true);
      return;
    }

    setIsGeneratingVisualization(true);
    setShowVisualizationModal(true);

    try {
      const html = await generateVisualization(messageText);
      setCurrentVisualization(html);
      
      // Cache the visualization
      setVisualizationCache(prev => new Map([...prev, [messageId, html]]));
      setVisualizedMessages(prev => new Set([...prev, messageId]));
      
    } catch (err) {
      console.error('Visualization generation error:', err);
      setVisualizationError(err instanceof Error ? err.message : 'Failed to generate visualization');
    } finally {
      setIsGeneratingVisualization(false);
    }
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
      <View key={message.id} style={[
        styles.messageContainer,
        message.isUser ? styles.userMessageContainer : styles.botMessageContainer
      ]}>
        <View style={[
          styles.avatarContainer,
          message.isUser ? styles.userAvatar : styles.botAvatar
        ]}>
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
          
          {!message.isUser && formattedText.length > 100 && (
            <TouchableOpacity
              style={styles.visualizationButton}
              onPress={() => createVisualization(formattedText, message.id)}
            >
              <Text style={styles.visualizationButtonText}>
                📊 {visualizedMessages.has(message.id) ? 'View Visualization' : 'Create Visualization'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a2e" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🚀</Text>
          </View>
          <Text style={styles.headerTitle}>Astra: Company Intelligence Agent</Text>
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
              <View style={styles.botAvatar}>
                <Text style={styles.avatar}>🚀</Text>
              </View>
              <View style={styles.loadingBubble}>
                <Text style={styles.loadingText}>Astra is gathering information from company meetings, documents, financials, latest news and more as needed</Text>
                <View style={styles.typingIndicator}>
                  <View style={[styles.dot, { animationDelay: '0ms' }]} />
                  <View style={[styles.dot, { animationDelay: '150ms' }]} />
                  <View style={[styles.dot, { animationDelay: '300ms' }]} />
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <View style={styles.errorContent}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={retryLastMessage}>
                <Text style={styles.retryButtonText}>🔄 Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
        transparent={false}
        animationType="slide"
        onRequestClose={() => setShowVisualizationModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setShowVisualizationModal(false)}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>📊 Data Visualization</Text>
            <View style={styles.backButton} />
          </View>

          {isGeneratingVisualization ? (
            <View style={styles.loadingVisualization}>
              <ActivityIndicator size="large" color="#FF4500" />
              <Text style={styles.loadingVisualizationText}>Generating Visualization</Text>
              <Text style={styles.loadingVisualizationSubtext}>
                Using AI to analyze your data and create interactive charts...
              </Text>
            </View>
          ) : visualizationError ? (
            <View style={styles.errorVisualization}>
              <Text style={styles.errorVisualizationIcon}>⚠️</Text>
              <Text style={styles.errorVisualizationTitle}>Visualization Error</Text>
              <Text style={styles.errorVisualizationText}>{visualizationError}</Text>
              <TouchableOpacity
                style={styles.retryVisualizationButton}
                onPress={() => {
                  setVisualizationError(null);
                  setIsGeneratingVisualization(true);
                  // Retry logic would go here
                }}
              >
                <Text style={styles.retryVisualizationButtonText}>🔄 Retry</Text>
              </TouchableOpacity>
            </View>
          ) : currentVisualization ? (
            <WebView
              source={{ html: currentVisualization }}
              style={styles.webView}
              javaScriptEnabled={true}
              domStorageEnabled={true}
            />
          ) : null}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  flex1: {
    flex: 1,
  },
  header: {
    backgroundColor: '#1a1a2e',
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
    backgroundColor: '#FF4500',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  logoEmoji: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    flex: 1,
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
    backgroundColor: '#FF4500',
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
  userAvatar: {
    backgroundColor: '#3b82f6',
  },
  botAvatar: {
    backgroundColor: '#FF4500',
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
    backgroundColor: '#FF4500',
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
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  loadingBubble: {
    backgroundColor: '#FF4500',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    maxWidth: width * 0.75,
  },
  loadingText: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'white',
    marginRight: 4,
  },
  errorContainer: {
    backgroundColor: '#7f1d1d',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorText: {
    color: '#fca5a5',
    fontSize: 14,
    flex: 1,
  },
  retryButton: {
    marginLeft: 8,
  },
  retryButtonText: {
    color: '#fca5a5',
    fontSize: 14,
  },
  inputContainer: {
    backgroundColor: '#1a1a2e',
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
    backgroundColor: '#FF4500',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  backButton: {
    width: 60,
  },
  backButtonText: {
    color: '#FF4500',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  loadingVisualization: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  loadingVisualizationText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 16,
    marginBottom: 8,
  },
  loadingVisualizationSubtext: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
  },
  errorVisualization: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  errorVisualizationIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorVisualizationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  errorVisualizationText: {
    fontSize: 16,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryVisualizationButton: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryVisualizationButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  webView: {
    flex: 1,
  },
});