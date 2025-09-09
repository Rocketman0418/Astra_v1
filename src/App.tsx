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
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate visualization based on content analysis
    const htmlContent = generateMockVisualization(content, type);
    return htmlContent;
  };

  const generateMockVisualization = (content: string, type: 'quick' | 'detailed') => {
    // Analyze content for keywords to determine chart type
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
      // Default dashboard
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
      // Default dashboard
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
      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ API Error:', errorData);
        throw new Error(\`Gemini API error: ${response.status} - ${errorData}`);
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
    }
  }
}