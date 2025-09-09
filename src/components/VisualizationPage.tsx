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
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col w-full">
        {/* Mobile Header */}
        <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-gray-700 p-2 sticky top-0 z-50 w-full">
          <div className="flex items-center justify-between w-full">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-300 hover:text-white transition-colors p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-[#FF4500] rounded-full flex items-center justify-center">
                <span className="text-sm">🚀</span>
              </div>
              <span className="bg-gradient-to-r from-[#FF4500] to-[#FF6B35] bg-clip-text text-transparent font-bold text-sm">
                Astra AI
              </span>
            </div>
            <div className="w-9"></div> {/* Spacer for centering */}
          </div>
        </header>

        {/* Loading Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#FF4500] rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Building Your Chart
            </h2>
            <p className="text-gray-400 mb-4">
              Creating your visualization...
            </p>
            <div className="flex items-center justify-center space-x-2 text-[#FF4500]">
              <div className="w-2 h-2 bg-[#FF4500] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-[#FF4500] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-[#FF4500] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col w-full">
        {/* Mobile Header */}
        <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-gray-700 p-2 sticky top-0 z-50 w-full">
          <div className="flex items-center justify-between w-full">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-300 hover:text-white transition-colors p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-[#FF4500] rounded-full flex items-center justify-center">
                <span className="text-sm">🚀</span>
              </div>
              <span className="bg-gradient-to-r from-[#FF4500] to-[#FF6B35] bg-clip-text text-transparent font-bold text-sm">
                Astra AI
              </span>
            </div>
            <div className="w-9"></div> {/* Spacer for centering */}
          </div>
        </header>

        {/* Error Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Chart Failed</h2>
            <p className="text-gray-400 mb-6">{error}</p>
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full bg-[#FF4500] text-white px-6 py-3 rounded-lg hover:bg-[#EA580C] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={handleBack}
                className="w-full bg-gray-700 text-white px-6 py-3 rounded-lg hover:bg-gray-600 transition-colors"
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
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col w-full">
      {/* Mobile Header */}
      <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-gray-700 p-2 sticky top-0 z-50 w-full">
        <div className="flex items-center justify-between w-full">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-300 hover:text-white transition-colors p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-[#FF4500] rounded-full flex items-center justify-center">
              <span className="text-sm">🚀</span>
            </div>
            <span className="bg-gradient-to-r from-[#FF4500] to-[#FF6B35] bg-clip-text text-transparent font-bold text-sm">
              Astra AI
            </span>
          </div>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Visualization Content */}
      <div className="flex-1 w-full">
        {visualizationHTML ? (
          <iframe
            srcDoc={visualizationHTML}
            className="w-full h-full border-0 bg-transparent"
            title="AI Generated Visualization"
            sandbox="allow-scripts allow-same-origin"
            style={{ 
              minHeight: 'calc(100vh - 60px)',
              height: 'calc(100vh - 60px)'
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No Chart Content</h2>
              <p className="text-gray-400">The AI did not generate any chart content.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationPage;