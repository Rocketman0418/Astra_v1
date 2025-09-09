import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, BarChart3, Loader2, AlertCircle, RotateCcw } from 'lucide-react';

interface VisualizationPageProps {
  cacheVisualization?: (messageId: string, htmlContent: string) => void;
}

const VisualizationPage: React.FC<VisualizationPageProps> = ({ cacheVisualization }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visualizationHtml, setVisualizationHtml] = useState<string>('');
  const hasInitialized = useRef(false);

  const { messageContent, visualizationType, cachedVisualization, messageId } = location.state || {};

  const generateVisualization = async (content: string, type: 'quick' | 'detailed') => {
    console.log('🔑 API Key check:', {
      hasApiKey: !!import.meta.env.VITE_GEMINI_API_KEY,
      apiKeyLength: import.meta.env.VITE_GEMINI_API_KEY?.length || 0
    });

    if (!import.meta.env.VITE_GEMINI_API_KEY) {
      throw new Error('Gemini API key not found. Please check your environment variables.');
    }

    const prompt = `Create a comprehensive HTML data visualization dashboard based on this content: "${content}"

Requirements:
- Use Chart.js for interactive charts
- Dark theme with these exact colors:
  * Background: #1a1a2e and #16213e (gradients)
  * Primary orange: #FF4500
  * Secondary orange: #FF6B35
  * Accent orange: #FFAD5A
  * Text: white and light gray
- Include multiple relevant charts (bar, line, pie, doughnut as appropriate)
- Add key metrics cards at the top
- Professional dashboard layout
- RocketHub branding
- Responsive design
- No external CSS frameworks except Chart.js

Return ONLY the complete HTML code, no explanations or markdown.`;

    console.log('🚀 Making Gemini 2.5 Flash API request...');

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`, {
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
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        })
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ API Error:', errorData);
        throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      console.log('📊 API Response received, processing...');

      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response format from Gemini API');
      }

      const htmlContent = data.candidates[0].content.parts[0].text;
      console.log('✅ Generated HTML length:', htmlContent.length);
      
      return htmlContent;
    } catch (error) {
      console.error('❌ Gemini API Error:', error);
      throw error;
    }
  };

  useEffect(() => {
    if (hasInitialized.current) {
      console.log('⏭️ Already initialized, skipping...');
      return;
    }

    const loadVisualization = async () => {
      console.log('🔄 Starting visualization load...');
      
      if (!messageContent) {
        console.log('❌ No message content provided');
        setError('No message content provided');
        setIsLoading(false);
        return;
      }

      // Check if we have cached visualization
      if (cachedVisualization) {
        console.log('✅ Using cached visualization');
        setVisualizationHtml(cachedVisualization);
        setIsLoading(false);
        hasInitialized.current = true;
        return;
      }

      try {
        console.log('🔄 Setting loading to true');
        setIsLoading(true);
        setError(null);
        hasInitialized.current = true;
        
        console.log('🚀 Generating visualization...');
        const html = await generateVisualization(messageContent, visualizationType || 'quick');
        console.log('✅ Visualization generated, setting HTML...');
        setVisualizationHtml(html);
        
        // Cache the visualization
        if (cacheVisualization && messageId) {
          console.log('💾 Caching visualization...');
          cacheVisualization(messageId, html);
        }
        
        console.log('✅ Visualization set successfully, clearing loading state');
      } catch (err) {
        console.error('Visualization generation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate visualization');
      } finally {
        console.log('🔄 Setting loading to false');
        setIsLoading(false);
      }
    };

    loadVisualization();
  }, [messageContent, visualizationType, cachedVisualization, messageId, cacheVisualization]);

  const handleGoBack = () => {
    navigate('/');
  };

  const handleRetry = () => {
    setError(null);
    setVisualizationHtml('');
    setIsLoading(true);
    hasInitialized.current = false;
    
    // Retry generation
    setTimeout(async () => {
      try {
        const html = await generateVisualization(messageContent, visualizationType || 'quick');
        setVisualizationHtml(html);
        
        if (cacheVisualization && messageId) {
          cacheVisualization(messageId, html);
        }
      } catch (err) {
        console.error('Retry error:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate visualization');
      } finally {
        setIsLoading(false);
        hasInitialized.current = true;
      }
    }, 500);
  };

  if (!messageContent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-lg mb-4">No visualization data available</p>
          <button
            onClick={handleGoBack}
            className="bg-[#FF4500] hover:bg-[#FF6B35] text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex flex-col">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1a1a2e] to-[#16213e] border-b border-gray-700 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleGoBack}
            className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-6 h-6 text-[#FF4500]" />
            <h1 className="text-xl font-bold text-white">Data Visualization</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-[#FF4500] animate-spin mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Generating Visualization</h2>
              <p className="text-gray-400 text-center max-w-md">
                Astra AI will analyze your data and create your visualization
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Visualization Error</h2>
              <p className="text-gray-400 mb-6 max-w-md mx-auto">{error}</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={handleRetry}
                  className="flex items-center space-x-2 bg-[#FF4500] hover:bg-[#FF6B35] text-white px-6 py-3 rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retry</span>
                </button>
                <button
                  onClick={handleGoBack}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Go Back to Chat
                </button>
              </div>
            </div>
          ) : visualizationHtml ? (
            <div className="space-y-6">
              {/* Visualization Container */}
              <div className="rounded-lg shadow-lg overflow-hidden">
                <iframe
                  srcDoc={visualizationHtml}
                  className="w-full h-[600px] border-0"
                  title="Data Visualization"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>

              {/* Action Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleGoBack}
                  className="bg-gray-700 hover:bg-gray-600 text-white px-8 py-3 rounded-lg transition-colors font-medium"
                >
                  Back to Chat
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default VisualizationPage;