import React, { useState, useEffect } from 'react';
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

  const { messageContent, visualizationType, cachedVisualization, messageId } = location.state || {};

  const generateVisualization = async (content: string, type: 'quick' | 'detailed') => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please check your environment variables.');
    }

    const prompt = type === 'quick' 
      ? `Create a simple HTML visualization (chart, graph, or dashboard) based on this data. Use Chart.js or similar libraries via CDN. Make it colorful and professional. Return only the complete HTML code that can be displayed in an iframe:

${content}`
      : `Create a comprehensive HTML dashboard with multiple visualizations based on this data. Include charts, graphs, tables, and key metrics. Use Chart.js, D3.js, or similar libraries via CDN. Make it interactive and professional. Return only the complete HTML code that can be displayed in an iframe:

${content}`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response from Gemini API');
    }

    let htmlContent = data.candidates[0].content.parts[0].text;
    
    // Clean up the HTML content
    htmlContent = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Ensure it's a complete HTML document
    if (!htmlContent.includes('<!DOCTYPE html>') && !htmlContent.includes('<html')) {
      htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Data Visualization</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        ${htmlContent}
    </div>
</body>
</html>`;
    }
    
    return htmlContent;
  };

  useEffect(() => {
    const loadVisualization = async () => {
      if (!messageContent) {
        setError('No message content provided');
        setIsLoading(false);
        return;
      }

      // Check if we have cached visualization
      if (cachedVisualization) {
        setVisualizationHtml(cachedVisualization);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const html = await generateVisualization(messageContent, visualizationType || 'quick');
        setVisualizationHtml(html);
        
        // Cache the visualization
        if (cacheVisualization && messageId) {
          cacheVisualization(messageId, html);
        }
      } catch (err) {
        console.error('Visualization generation error:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate visualization');
      } finally {
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
                Using AI to analyze your data and create interactive charts...
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
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <iframe
                  srcDoc={visualizationHtml}
                  className="w-full h-[600px] border-0"
                  title="Data Visualization"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGoBack}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Back to Chat
                </button>
                <button
                  onClick={() => {
                    // Create a blob URL for the HTML content
                    const blob = new Blob([visualizationHtml], { type: 'text/html' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'astra-visualization.html';
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex-1 bg-[#FF4500] hover:bg-[#FF6B35] text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Download Visualization
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