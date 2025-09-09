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
  const [hasInitialized, setHasInitialized] = useState(false);

  const { messageContent, visualizationType, cachedVisualization, messageId } = location.state || {};

  const generateVisualizationWithGemini = async (content: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    console.log('🔑 API Key check:', {
      hasApiKey: !!apiKey,
      keyLength: apiKey ? apiKey.length : 0,
      keyStart: apiKey ? apiKey.substring(0, 10) + '...' : 'N/A'
    });

    if (!apiKey) {
      console.log('❌ No Gemini API key found, falling back to mock');
      throw new Error('No API key available');
    }

    const prompt = `Create a comprehensive HTML visualization dashboard based on this business data:

"${content}"

Requirements:
1. Create a complete HTML page with embedded CSS and JavaScript
2. Use Chart.js for interactive charts (load from CDN)
3. Include multiple relevant visualizations (charts, metrics, KPIs)
4. Use professional styling with gradients and modern design
5. Make it responsive and visually appealing
6. Include RocketHub branding colors (#FF4500 orange theme)
7. Add meaningful titles, labels, and descriptions
8. Include at least 3-5 key metrics as cards
9. Use appropriate chart types based on the data (line, bar, pie, etc.)
10. Make the data realistic and relevant to the content

Return ONLY the complete HTML code, no explanations or markdown.`;

    console.log('🚀 Making Gemini API request...');

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`, {
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
        const errorText = await response.text();
        console.error('❌ API Error:', errorText);
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 API Response received, processing...');

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const htmlContent = data.candidates[0].content.parts[0].text;
        console.log('✅ Generated HTML length:', htmlContent.length);
        
        if (htmlContent.length < 1000) {
          console.log('⚠️ HTML seems too short, falling back to mock');
          throw new Error('Generated content too short');
        }
        
        return htmlContent;
      } else {
        console.error('❌ Invalid API response structure:', data);
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('❌ Gemini API error:', error);
      throw error;
    }
  };

  const generateMockVisualization = (content: string): string => {
    console.log('🎭 Using mock visualization fallback');
    
    const lowerContent = content.toLowerCase();
    const hasRevenue = lowerContent.includes('revenue') || lowerContent.includes('sales') || lowerContent.includes('income');
    const hasGrowth = lowerContent.includes('growth') || lowerContent.includes('increase') || lowerContent.includes('trend');
    const hasComparison = lowerContent.includes('vs') || lowerContent.includes('compare') || lowerContent.includes('versus');
    const hasTime = lowerContent.includes('year') || lowerContent.includes('month') || lowerContent.includes('quarter');
    
    let chartType = 'bar';
    let chartData = '';
    let title = 'Data Analysis';
    let metrics = '';
    
    if (hasRevenue && hasTime) {
      chartType = 'line';
      title = 'Revenue Growth Analysis';
      chartData = `
        labels: ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024'],
        datasets: [{
          label: 'Revenue ($M)',
          data: [12, 19, 25, 32, 45],
          borderColor: '#FF4500',
          backgroundColor: 'rgba(255, 69, 0, 0.1)',
          borderWidth: 3,
          fill: true
        }]`;
      metrics = `
        <div class="metric">
          <h3>Total Revenue</h3>
          <p>$133M</p>
        </div>
        <div class="metric">
          <h3>Growth Rate</h3>
          <p>275%</p>
        </div>
        <div class="metric">
          <h3>Avg. Quarterly</h3>
          <p>$26.6M</p>
        </div>`;
    } else if (hasComparison) {
      chartType = 'bar';
      title = 'Comparative Analysis';
      chartData = `
        labels: ['Product A', 'Product B', 'Product C', 'Product D'],
        datasets: [{
          label: 'Performance Score',
          data: [85, 92, 78, 96],
          backgroundColor: ['#FF4500', '#FF6B35', '#FF8C42', '#FFAD5A'],
          borderColor: '#FF4500',
          borderWidth: 2
        }]`;
      metrics = `
        <div class="metric">
          <h3>Best Performer</h3>
          <p>Product D</p>
        </div>
        <div class="metric">
          <h3>Average Score</h3>
          <p>87.8</p>
        </div>
        <div class="metric">
          <h3>Improvement</h3>
          <p>+12%</p>
        </div>`;
    } else if (hasGrowth) {
      chartType = 'line';
      title = 'Growth Trend Analysis';
      chartData = `
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{
          label: 'Growth %',
          data: [5, 12, 18, 25, 32, 45],
          borderColor: '#FF4500',
          backgroundColor: 'rgba(255, 69, 0, 0.2)',
          borderWidth: 3,
          fill: true
        }]`;
      metrics = `
        <div class="metric">
          <h3>Peak Growth</h3>
          <p>45%</p>
        </div>
        <div class="metric">
          <h3>Avg Growth</h3>
          <p>22.8%</p>
        </div>
        <div class="metric">
          <h3>Trend</h3>
          <p>Upward</p>
        </div>`;
    } else {
      chartType = 'doughnut';
      title = 'Data Overview';
      chartData = `
        labels: ['Category A', 'Category B', 'Category C', 'Category D'],
        datasets: [{
          data: [35, 25, 20, 20],
          backgroundColor: ['#FF4500', '#FF6B35', '#FF8C42', '#FFAD5A'],
          borderWidth: 2
        }]`;
      metrics = `
        <div class="metric">
          <h3>Total Items</h3>
          <p>100</p>
        </div>
        <div class="metric">
          <h3>Categories</h3>
          <p>4</p>
        </div>
        <div class="metric">
          <h3>Top Category</h3>
          <p>Category A</p>
        </div>`;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
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
        .metric h3 { margin: 0 0 5px 0; font-size: 14px; }
        .metric p { margin: 0; font-size: 18px; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1>📊 ${title}</h1>
        <div class="metrics">
            ${metrics}
        </div>
        <div class="chart-container">
            <canvas id="chart"></canvas>
        </div>
    </div>
    <script>
        const ctx = document.getElementById('chart').getContext('2d');
        new Chart(ctx, {
            type: '${chartType}',
            data: {
                ${chartData}
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: '${title}'
                    }
                }
            }
        });
    </script>
</body>
</html>`;
      
    console.log('🎭 Mock HTML length:', htmlContent.length);
    return htmlContent;
  };

  const generateVisualization = async (content: string): Promise<string> => {
    try {
      // Try Gemini first
      return await generateVisualizationWithGemini(content);
    } catch (error) {
      console.log('⚠️ Gemini failed, falling back to mock:', error);
      // Fall back to mock visualization
      return generateMockVisualization(content);
    }
  };

  useEffect(() => {
    if (hasInitialized) return;

    const loadVisualization = async () => {
      console.log('🔄 Starting visualization load...');
      
      if (!messageContent) {
        console.log('❌ No message content provided');
        setError('No message content provided');
        setIsLoading(false);
        setHasInitialized(true);
        return;
      }

      // Check if we have cached visualization
      if (cachedVisualization) {
        console.log('✅ Using cached visualization');
        setVisualizationHtml(cachedVisualization);
        setIsLoading(false);
        setHasInitialized(true);
        return;
      }

      try {
        console.log('🔄 Setting loading to true');
        setIsLoading(true);
        setError(null);
        
        console.log('🚀 Generating visualization...');
        const html = await generateVisualization(messageContent);
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
        setHasInitialized(true);
      }
    };

    loadVisualization();
  }, [hasInitialized, messageContent, cachedVisualization, messageId, cacheVisualization]);

  const handleGoBack = () => {
    navigate('/');
  };

  const handleRetry = () => {
    setError(null);
    setVisualizationHtml('');
    setIsLoading(true);
    setHasInitialized(false); // Reset to allow re-execution
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