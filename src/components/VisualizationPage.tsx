import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { callGeminiAPI, generateQuickVisualizationPrompt, detectContentType, generateFallbackVisualization, GEMINI_CONFIG } from '../utils/geminiVisualization';

interface VisualizationPageProps {
  cacheVisualization?: (messageId: string, htmlContent: string) => void;
}

const VisualizationPage: React.FC<VisualizationPageProps> = ({ cacheVisualization }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visualizationHTML, setVisualizationHTML] = useState<string>('');

  const messageContent = location.state?.messageContent || '';
  const visualizationType = location.state?.visualizationType || 'visualization';
  const cachedVisualization = location.state?.cachedVisualization;
  const messageId = location.state?.messageId;

  useEffect(() => {
    if (!messageContent) {
      navigate('/');
      return;
    }

    // If we have a cached visualization, use it
    if (cachedVisualization) {
      setVisualizationHTML(cachedVisualization);
      setIsLoading(false);
    } else {
      generateVisualization();
    }
  }, [messageContent]);

  const generateVisualization = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Try to get API key from environment variables
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log('🔑 Mobile Visualization - API Key check:', {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        environment: import.meta.env.MODE,
        userAgent: navigator.userAgent,
        isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
      });
      
      if (apiKey && apiKey.trim() !== '' && apiKey !== 'undefined') {
        console.log('🚀 Mobile - Attempting Gemini API call...');
        try {
          const prompt = generateQuickVisualizationPrompt(messageContent);
          const response = await callGeminiAPI(prompt, apiKey);
          
          // Clean up the response - remove markdown code blocks if present
          let cleanedResponse = response;
          if (response.includes('```html')) {
            cleanedResponse = response.replace(/```html\s*/g, '').replace(/```\s*$/g, '');
          }
          
          // Validate that we got HTML content
          if (cleanedResponse.includes('<!DOCTYPE html>') || cleanedResponse.includes('<html')) {
            console.log('✅ Mobile - Valid HTML response from Gemini API');
            setVisualizationHTML(cleanedResponse);
            
            // Cache the API-generated visualization
            if (cacheVisualization && messageId) {
              cacheVisualization(messageId, cleanedResponse);
            }
            return;
          } else {
            console.log('⚠️ Mobile - Response doesn\'t look like HTML, using fallback');
            throw new Error('Invalid HTML response from Gemini');
          }
        } catch (apiError) {
          console.error('❌ Mobile - Gemini API failed:', apiError);
          // Don't set error, just fall through to fallback
        }
      } else {
        console.log('⚠️ Mobile - No valid API key found, using fallback visualization');
      }
      
      // Fallback visualization
      console.log('📊 Mobile - Generating fallback visualization');
      const fallbackHTML = generateFallbackVisualization(messageContent);
      setVisualizationHTML(fallbackHTML);
      
      // Cache the fallback visualization
      if (cacheVisualization && messageId) {
        cacheVisualization(messageId, fallbackHTML);
      }
      
    } catch (err) {
      console.error('Failed to generate visualization:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate visualization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    generateVisualization();
  };

  const handleBack = () => {
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="viz-page">
        {/* Mobile Header */}
        <header className="viz-header">
          <div className="viz-header-content">
            <button
              onClick={handleBack}
              className="viz-back-button"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="viz-header-title">
              <div className="viz-header-logo">
                <span>🚀</span>
              </div>
              <span>Astra AI</span>
            </div>
            <div className="viz-spacer"></div>
          </div>
        </header>

        {/* Loading Content */}
        <div className="viz-content">
          <div className="viz-loading">
            <div className="viz-loading-icon">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <h2 className="viz-loading-title">
              Building Your Chart
            </h2>
            <p className="viz-loading-text">
              Creating your visualization...
            </p>
            <div className="viz-loading-dots">
              <div className="viz-dot" style={{ animationDelay: '0ms' }}></div>
              <div className="viz-dot" style={{ animationDelay: '150ms' }}></div>
              <div className="viz-dot" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="viz-page">
        {/* Mobile Header */}
        <header className="viz-header">
          <div className="viz-header-content">
            <button
              onClick={handleBack}
              className="viz-back-button"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="viz-header-title">
              <div className="viz-header-logo">
                <span>🚀</span>
              </div>
              <span>Astra AI</span>
            </div>
            <div className="viz-spacer"></div>
          </div>
        </header>

        {/* Error Content */}
        <div className="viz-content">
          <div className="viz-error">
            <div className="viz-error-icon">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="viz-error-title">Chart Failed</h2>
            <p className="viz-error-text">{error}</p>
            <div className="viz-error-actions">
              <button
                onClick={handleRetry}
                className="viz-retry-button"
              >
                Try Again
              </button>
              <button
                onClick={handleBack}
                className="viz-back-to-chat-button"
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
    <div className="viz-page">
      {/* Mobile Header */}
      <header className="viz-header">
        <div className="viz-header-content">
          <button
            onClick={handleBack}
            className="viz-back-button"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="viz-header-title">
            <div className="viz-header-logo">
              <span>🚀</span>
            </div>
            <span>Astra AI</span>
          </div>
          <div className="viz-spacer"></div>
        </div>
      </header>

      {/* Visualization Content */}
      <div className="viz-iframe-container">
        {visualizationHTML ? (
          <iframe
            srcDoc={visualizationHTML}
            className="viz-iframe"
            title="AI Generated Visualization"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="viz-no-content">
            <div className="viz-no-content-inner">
              <div className="viz-no-content-icon">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="viz-no-content-title">No Chart Content</h2>
              <p className="viz-no-content-text">The AI did not generate any chart content.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationPage;