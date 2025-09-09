import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, BarChart3, Loader2 } from 'lucide-react';

interface VisualizationPageProps {
  cacheVisualization?: (messageId: string, htmlContent: string) => void;
}

const VisualizationPage: React.FC<VisualizationPageProps> = ({ cacheVisualization }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { messageContent, visualizationType, cachedVisualization, messageId } = location.state || {};

  useEffect(() => {
    // Simulate loading time for visualization generation
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleGoBack = () => {
    navigate('/');
  };

  if (!messageContent) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#1a1a2e] to-[#16213e] flex items-center justify-center">
        <div className="text-center text-white">
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
        <div className="max-w-4xl mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-[#FF4500] animate-spin mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Generating Visualization</h2>
              <p className="text-gray-400 text-center max-w-md">
                Analyzing your data and creating interactive charts...
              </p>
            </div>
          ) : error ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Visualization Error</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <button
                onClick={handleGoBack}
                className="bg-[#FF4500] hover:bg-[#FF6B35] text-white px-6 py-3 rounded-lg transition-colors"
              >
                Go Back to Chat
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Visualization Preview */}
              <div className="bg-white rounded-lg p-8 shadow-lg">
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Visualization Ready</h3>
                  <p className="text-gray-600 mb-6">
                    Your data visualization has been generated successfully!
                  </p>
                  <div className="bg-gray-100 rounded-lg p-4 text-left">
                    <h4 className="font-semibold text-gray-800 mb-2">Based on:</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {messageContent.substring(0, 200)}...
                    </p>
                  </div>
                </div>
              </div>

              {/* Coming Soon Notice */}
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/20 rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-3">
                  <span className="text-2xl">🚀</span>
                  <h3 className="text-xl font-bold text-white">Interactive Charts Coming Soon</h3>
                </div>
                <p className="text-gray-300 mb-4">
                  We're working on bringing you interactive data visualizations including:
                </p>
                <ul className="text-gray-400 space-y-2">
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    <span>Interactive bar charts and line graphs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                    <span>Real-time data dashboards</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span>Exportable charts and reports</span>
                  </li>
                </ul>
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
                    // Simulate sharing functionality
                    if (navigator.share) {
                      navigator.share({
                        title: 'Astra AI Visualization',
                        text: 'Check out this data visualization from Astra AI',
                        url: window.location.href
                      });
                    } else {
                      // Fallback for browsers that don't support Web Share API
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    }
                  }}
                  className="flex-1 bg-[#FF4500] hover:bg-[#FF6B35] text-white px-6 py-3 rounded-lg transition-colors font-medium"
                >
                  Share Visualization
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisualizationPage;