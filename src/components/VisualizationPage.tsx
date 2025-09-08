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
      console.log('🔑 Retry - API Key check:', {
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey ? apiKey.length : 0,
        environment: import.meta.env.MODE
      });
      
      if (apiKey && apiKey.trim() !== '' && apiKey !== 'undefined') {
        console.log('🚀 Attempting Gemini API call...');
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
            console.log('✅ Valid HTML response from Gemini API');
            setVisualizationHTML(cleanedResponse);
            
            // Cache the API-generated visualization
            if (cacheVisualization && messageId) {
              cacheVisualization(messageId, cleanedResponse);
            }
            return;
          } else {
            console.log('⚠️ Response doesn\'t look like HTML, using fallback');
            throw new Error('Invalid HTML response from Gemini');
          }
        } catch (apiError) {
          console.error('❌ Gemini API failed:', apiError);
          // Don't set error, just fall through to fallback
        }
      } else {
        console.log('⚠️ No valid API key found, using fallback visualization');
      }
      
      // Fallback visualization
      console.log('📊 Generating fallback visualization');
      if (apiKey && apiKey.trim() !== '' && apiKey !== 'undefined') {
        console.log('🚀 Retry - Attempting Gemini API call...');
        try {
          const prompt = generateQuickVisualizationPrompt(messageContent);
          const response = await callGeminiAPI(prompt, apiKey);
          
          // Validate that we got HTML content
          if (response.includes('<!DOCTYPE html>') || response.includes('<html')) {
            console.log('✅ Retry - Valid HTML response from Gemini API');
            setVisualizationHTML(response);
            
            // Cache the API-generated visualization
            if (cacheVisualization && messageId) {
              cacheVisualization(messageId, response);
            }
            return;
          } else {
            console.log('⚠️ Retry - Response doesn\'t look like HTML, using fallback');
            throw new Error('Invalid HTML response from Gemini');
          }
        } catch (apiError) {
          console.error('❌ Retry - Gemini API failed:', apiError);
          // Don't set error, just fall through to fallback
        }
      } else {
        console.log('⚠️ Retry - No valid API key found, using fallback visualization');
      }
      
      // Fallback visualization
      console.log('📊 Retry - Generating fallback visualization');
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
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col">
        {/* Header - Same as chat page */}
        <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-gray-700 px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center space-x-3">
            <img 
              src="/RocketHub Logo Alt 1.png" 
              alt="RocketHub Logo" 
              className="h-14 w-auto"
            />
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-white flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-[#FF4500] rounded-full flex items-center justify-center">
                  <span className="text-lg">🚀</span>
                </div>
                <span className="bg-gradient-to-r from-[#FF4500] to-[#FF6B35] bg-clip-text text-transparent font-extrabold tracking-wide">
                  Astra: Company Intelligence Agent
                </span>
              </h1>
            </div>
            <div className="w-14 flex justify-end">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            </div>
          </div>
        </header>

        {/* Loading Content */}
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
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col">
        {/* Header - Same as chat page */}
        <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-gray-700 px-6 py-4 sticky top-0 z-50">
          <div className="flex items-center space-x-3">
            <img 
              src="/RocketHub Logo Alt 1.png" 
              alt="RocketHub Logo" 
              className="h-14 w-auto"
            />
            <div className="flex-1 text-center">
              <h1 className="text-xl font-bold text-white flex items-center justify-center space-x-3">
                <div className="w-8 h-8 bg-[#FF4500] rounded-full flex items-center justify-center">
                  <span className="text-lg">🚀</span>
                </div>
                <span className="bg-gradient-to-r from-[#FF4500] to-[#FF6B35] bg-clip-text text-transparent font-extrabold tracking-wide">
                  Astra: Company Intelligence Agent
                </span>
              </h1>
            </div>
            <div className="w-14 flex justify-end">
              <button
                onClick={handleBack}
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            </div>
          </div>
        </header>

        {/* Error Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <span className="text-xl sm:text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Visualization Failed</h2>
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
      {/* Header - Same as chat page */}
      <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-gray-700 px-2 sm:px-6 py-2 sm:py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between w-full">
          <img 
            src="/rockethub-logo.png"
            alt="RocketHub Logo" 
            className="h-8 sm:h-12 w-auto flex-shrink-0"
            onError={(e) => {
              console.error('Logo failed to load:', e);
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="flex-1 flex items-center justify-center px-2">
            <h1 className="text-xs sm:text-xl font-bold text-white flex items-center space-x-1 sm:space-x-3">
              <div className="w-5 h-5 sm:w-8 sm:h-8 bg-[#FF4500] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xs sm:text-lg">🚀</span>
              </div>
              <span className="bg-gradient-to-r from-[#FF4500] to-[#FF6B35] bg-clip-text text-transparent font-extrabold tracking-tight truncate max-w-[200px] sm:max-w-none">
                <span className="hidden sm:inline">Astra: Company Intelligence Agent</span>
                <span className="sm:hidden">Astra AI</span>
              </span>
            </h1>
          </div>
          <div className="flex justify-end flex-shrink-0">
            <button
              onClick={handleBack}
              className="flex items-center space-x-1 text-gray-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-gray-700 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* Visualization Content */}
      <div className="flex-1 overflow-hidden bg-gradient-to-b from-[#1a1a2e] to-[#16213e]">
        {visualizationHTML ? (
          <iframe
            srcDoc={visualizationHTML}
            className="w-full border-0 bg-transparent"
            title="AI Generated Visualization"
            sandbox="allow-scripts allow-same-origin"
            style={{ 
              minHeight: '100%',
              height: 'calc(100vh - 60px)',
              display: 'block'
            }}
            onLoad={(e) => {
              console.log('Iframe loaded');
              const iframe = e.target as HTMLIFrameElement;
              try {
                const doc = iframe.contentDocument;
                if (doc) {
                  console.log('Iframe content:', doc.documentElement.outerHTML.substring(0, 500));
                }
              } catch (err) {
                console.log('Cannot access iframe content due to sandbox restrictions');
              }
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4 py-8">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No Visualization Content</h2>
              <p className="text-base text-gray-400">The AI did not generate any visualization content.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisualizationPage;