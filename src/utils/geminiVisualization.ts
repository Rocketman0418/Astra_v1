// Gemini API configuration and utilities for generating visualizations

export interface GeminiConfig {
  apiKey: string;
  model: string;
}

export const GEMINI_CONFIG: GeminiConfig = {
  apiKey: import.meta.env.VITE_GEMINI_API_KEY || '',
  model: 'gemini-2.5-pro' // Default model, will be overridden per request
};

export const generateVisualizationPrompt = (content: string, contentType: 'financial' | 'meeting' | 'general' = 'general') => {
  return `Create a complete, self-contained HTML visualization dashboard for this business content. The visualization should be professional, interactive, and tailored to the specific content type.

Content to visualize:
${content}

Requirements:
1. Generate a complete HTML document with <!DOCTYPE html>, <html>, <head>, and <body> tags
2. Include embedded CSS in <style> tags and JavaScript in <script> tags - NO external dependencies
3. Use a full viewport layout with min-height: 100vh and proper body styling
4. Create actual data visualizations using HTML5 Canvas, SVG, or CSS-based charts
5. Extract key metrics from the content and create realistic sample data if needed
6. Use RocketHub branding: orange #FF4500 primary color, dark gradient backgrounds from #1a1a2e to #16213e
7. Include a prominent header with rocket emoji 🚀 and descriptive title
8. Create metric cards with large numbers, labels, and visual indicators
9. Add progress bars, bar charts, or simple visualizations using CSS and HTML
10. Use white text on dark backgrounds for readability
11. Make it responsive with proper padding, margins, and flexbox layouts
12. Include hover effects and smooth transitions
13. Ensure all text is clearly visible with proper contrast
14. Use modern CSS with border-radius, box-shadow, and gradients
15. Create realistic data points based on the content context
16. Make the layout fill the entire viewport properly

Return ONLY the complete HTML document, no explanations or markdown formatting.`;
};

export const generateQuickVisualizationPrompt = (content: string, contentType: 'financial' | 'meeting' | 'general' = 'general') => {
  return `Based on the text, create a comprehensive summary-level graphic visualization that helps me understand all the key information from this content. Include specific details, action items, and context so the visualization is genuinely helpful.

Content:
${content}

Create a detailed summary HTML dashboard. Requirements:
1. Complete HTML document with <!DOCTYPE html>, <html>, <head>, <body>
2. Use embedded CSS and minimal JavaScript if needed for interactivity
3. Full viewport styling with RocketHub theme: dark gradient background (#1a1a2e to #16213e), white text, orange (#FF4500) accents
4. Extract ALL key information from the content and present it visually
5. Include specific details like:
   - Key metrics with context and explanations
   - Important action items or tasks with descriptions
   - Deadlines, priorities, or status information
   - Names, categories, or classifications mentioned
   - Progress indicators or completion status
6. Use multiple sections: metric cards, lists, progress bars, status indicators
7. Make the information actionable - users should understand what needs to be done
8. Include hover effects and visual hierarchy to organize information
9. Use icons, emojis, and color coding to make information scannable
10. Ensure all important details from the original content are represented
11. Make sure to close all HTML tags properly

IMPORTANT: Focus on being comprehensive and helpful rather than brief. Extract and display ALL meaningful information from the content. Return ONLY the complete HTML document.`;
};

export const generateDetailedVisualizationPrompt = (content: string, contentType: 'financial' | 'meeting' | 'general' = 'general') => {
  return `Based on the text, create a comprehensive, detailed graphic visualization that presents ALL information from the content in an organized, visually rich dashboard format. This should be a complete analysis and presentation of every important detail.

Content:
${content}

Create a comprehensive HTML dashboard. Requirements:
1. Complete HTML document with <!DOCTYPE html>, <html>, <head>, <body>
2. Use embedded CSS and JavaScript for rich interactivity
3. Full viewport styling with RocketHub theme: dark gradient background (#1a1a2e to #16213e), white text, orange (#FF4500) accents
4. Create multiple comprehensive sections covering ALL aspects of the content:
   - Executive summary with key metrics
   - Detailed breakdown of all items, tasks, or topics
   - Priority matrices or categorization systems
   - Timeline or progress tracking where applicable
   - Action items with full context and details
   - Status indicators and completion tracking
   - Risk assessment or priority levels
   - Resource allocation or responsibility assignments
5. Use advanced layout with CSS Grid and Flexbox
6. Include interactive elements: collapsible sections, tabs, hover details, progress animations
7. Use rich visual elements: charts, graphs, timelines, kanban boards, progress rings
8. Implement comprehensive data visualization appropriate to content type
9. Add detailed tooltips, expandable sections, and drill-down capabilities
10. Use professional dashboard design patterns with clear information hierarchy
11. Include filtering, sorting, or categorization features where helpful
12. Make every piece of important information from the original content visible and actionable
13. Use color coding, icons, and visual indicators to enhance understanding
14. Ensure the visualization tells the complete story of the content

IMPORTANT: Be extremely comprehensive - this should be a complete analysis and presentation of ALL content. Don't leave out any important information. Return ONLY the complete HTML document.`;
};

const getSpecificInstructions = (contentType: 'financial' | 'meeting' | 'general') => {
  const specificInstructions = {
    financial: `
11. Focus on financial metrics, cash flow, revenue, expenses
12. Use currency formatting and financial chart types
13. Include trend analysis and growth indicators
14. Add financial health indicators and ratios`,
    
    meeting: `
11. Focus on meeting outcomes, action items, decisions
12. Use timeline visualizations and progress tracking
13. Include participant insights and key takeaways
14. Add priority matrices and status indicators`,
    
    general: `
11. Adapt visualization type based on content analysis
12. Use appropriate chart types for the data present
13. Include key insights and actionable information
14. Add contextual visual elements`
  };

  return specificInstructions[contentType];
};

export const detectContentType = (content: string): 'financial' | 'meeting' | 'general' => {
  const financialKeywords = ['revenue', 'profit', 'loss', 'cash flow', 'assets', 'liabilities', 'expenses', '$', 'financial'];
  const meetingKeywords = ['meeting', 'agenda', 'action items', 'decisions', 'participants', 'summary', 'next steps'];
  
  const lowerContent = content.toLowerCase();
  
  const financialScore = financialKeywords.reduce((score, keyword) => 
    score + (lowerContent.includes(keyword) ? 1 : 0), 0);
  
  const meetingScore = meetingKeywords.reduce((score, keyword) => 
    score + (lowerContent.includes(keyword) ? 1 : 0), 0);
  
  if (financialScore > meetingScore && financialScore > 2) return 'financial';
  if (meetingScore > financialScore && meetingScore > 2) return 'meeting';
  return 'general';
};

export const callGeminiAPI = async (prompt: string, apiKey: string, model: string = GEMINI_CONFIG.model): Promise<string> => {
  if (!apiKey || apiKey.trim() === '' || apiKey === 'undefined') {
    throw new Error('Gemini API key not configured. The visualization feature requires a Google AI Studio API key. Please contact your administrator to configure the VITE_GEMINI_API_KEY environment variable.');
  }

  console.log('🔑 Gemini API Call Debug:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey ? apiKey.length : 0,
    apiKeyStart: apiKey ? apiKey.substring(0, 10) : 'N/A',
    model: model,
    environment: import.meta.env.MODE
  });

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
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
        temperature: 0.3,
        topK: 40,
        topP: 0.95,
      }
    })
  });

  if (!response.ok) {
    console.error('❌ Gemini API HTTP Error:', response.status, response.statusText);
    throw new Error(`Gemini API error: ${response.status} - ${response.statusText}`);
  }

  const data = await response.json();
  
  // Log the full response for debugging
  console.log('✅ Gemini API Response received:', {
    hasCandidates: !!data.candidates,
    candidatesLength: data.candidates?.length || 0,
    hasError: !!data.error
  });
  
  // Check for error in response
  if (data.error) {
    console.error('❌ Gemini API Response Error:', data.error);
    throw new Error(`Gemini API error: ${data.error.message || 'Unknown error'}`);
  }
  
  // Check if candidates array exists and has content
  if (!data.candidates || data.candidates.length === 0) {
    console.error('❌ No candidates in Gemini response');
    throw new Error('No candidates returned from Gemini API. This may be due to safety filters or prompt complexity.');
  }
  
  const candidate = data.candidates[0];
  
  // Check if candidate was blocked by safety filters
  if (candidate.finishReason === 'SAFETY') {
    console.error('❌ Content blocked by safety filters');
    throw new Error('Content was blocked by Gemini safety filters. Try simplifying your request.');
  }
  
  // Check if response was truncated due to token limit
  if (candidate.finishReason === 'MAX_TOKENS') {
    console.error('❌ Response truncated due to token limit');
    throw new Error('The visualization was too complex and exceeded the token limit. Please try the Quick visualization instead, or ask for a simpler analysis.');
  }
  
  if (!candidate.content || !candidate.content.parts || candidate.content.parts.length === 0) {
    console.error('❌ Invalid response structure:', candidate);
    throw new Error(`Invalid response structure from Gemini API. Finish reason: ${candidate.finishReason || 'unknown'}`);
  }

  console.log('✅ Gemini API call successful, returning content');
  return candidate.content.parts[0].text;
};

// Fallback visualization generator for when API is not available
export const generateFallbackVisualization = (content: string): string => {
  const contentType = detectContentType(content);
  
  // Extract key insights from the content
  const lines = content.split('\n').filter(line => line.trim());
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  const words = content.split(/\s+/).filter(w => w.trim());
  
  // Try to extract numbers and metrics from content
  const numbers = content.match(/\$?[\d,]+\.?\d*/g) || [];
  const percentages = content.match(/\d+%/g) || [];
  const dates = content.match(/\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/g) || [];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Content Summary</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            color: white;
            min-height: 100vh;
            padding: 8px;
            font-size: 16px;
            line-height: 1.6;
            margin: 0;
            width: 100vw;
            overflow-x: hidden;
        }
        
        .container {
            max-width: 100vw;
            margin: 0 auto;
            padding: 0;
            box-sizing: border-box;
        }
        
        .header {
            text-align: center;
            margin-bottom: 15px;
            padding: 15px 0;
            border-bottom: 2px solid #FF4500;
        }
        
        .header h1 {
            font-size: 1.4rem;
            margin-bottom: 6px;
            background: linear-gradient(45deg, #FF4500, #FF6B35);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.2;
        }
        
        .header p {
            font-size: 0.8rem;
            opacity: 0.8;
        }
        
        .content-card {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 15px;
            margin-bottom: 15px;
            border: 1px solid rgba(255, 69, 0, 0.3);
            backdrop-filter: blur(10px);
            width: 100%;
            box-sizing: border-box;
        }
        
        .content-text {
            line-height: 1.6;
            font-size: 0.85rem;
            white-space: pre-wrap;
            word-wrap: break-word;
            max-height: 250px;
            overflow-y: auto;
        }
        
        .api-notice {
            background: linear-gradient(45deg, #4CAF50, #45a049);
            border-radius: 10px;
            padding: 12px;
            margin-bottom: 15px;
            text-align: center;
            width: 100%;
            box-sizing: border-box;
        }
        
        .api-notice h3 {
            margin-bottom: 6px;
            font-size: 1rem;
        }
        
        .api-notice p {
            opacity: 0.9;
            font-size: 0.75rem;
            margin-bottom: 8px;
        }
        
        .insights-grid {
            display: grid;
            grid-template-columns: 1fr;
            gap: 12px;
            margin-top: 15px;
            width: 100%;
        }
        
        .insight-card {
            background: rgba(76, 175, 80, 0.1);
            border: 1px solid #4CAF50;
            border-radius: 10px;
            padding: 12px;
            width: 100%;
            box-sizing: border-box;
        }
        
        .insight-title {
            color: #4CAF50;
            font-weight: bold;
            margin-bottom: 6px;
            font-size: 0.9rem;
        }
        
        .insight-list {
            list-style: none;
            padding: 0;
        }
        
        .insight-list li {
            padding: 6px 0;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            font-size: 0.8rem;
        }
        
        .insight-list li:last-child {
            border-bottom: none;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-top: 15px;
            width: 100%;
        }
        
        .stat-card {
            background: rgba(255, 69, 0, 0.1);
            border: 1px solid #FF4500;
            border-radius: 10px;
            padding: 12px;
            text-align: center;
            width: 100%;
            box-sizing: border-box;
        }
        
        .stat-number {
            font-size: 1.2rem;
            font-weight: bold;
            color: #FF4500;
            margin-bottom: 3px;
        }
        
        .stat-label {
            font-size: 0.7rem;
            opacity: 0.8;
        }
        
        @media (min-width: 768px) {
            body {
                padding: 20px;
                font-size: 18px;
            }
            
            .header h1 {
                font-size: 2.5rem;
                margin-bottom: 10px;
            }
            
            .header p {
                font-size: 1rem;
            }
            
            .content-card {
                padding: 30px;
                margin-bottom: 30px;
            }
            
            .content-text {
                font-size: 1.1rem;
                line-height: 1.8;
                max-height: none;
            }
            
            .api-notice {
                padding: 20px;
                margin-bottom: 30px;
            }
            
            .api-notice h3 {
                font-size: 1.3rem;
                margin-bottom: 10px;
            }
            
            .api-notice p {
                font-size: 0.95rem;
                margin-bottom: 15px;
            }
            
            .insights-grid {
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            
            .insight-card {
                padding: 20px;
            }
            
            .insight-title {
                font-size: 1.1rem;
                margin-bottom: 10px;
            }
            
            .insight-list li {
                padding: 5px 0;
                font-size: 1rem;
            }
            
            .stats {
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin-top: 30px;
            }
            
            .stat-card {
                padding: 20px;
            }
            
            .stat-number {
                font-size: 2rem;
                margin-bottom: 5px;
            }
            
            .stat-label {
                font-size: 0.9rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Content Summary</h1>
            <p>RocketHub Intelligence Dashboard</p>
        </div>
        
        <div class="api-notice">
            <h3>📊 Content Analysis Dashboard</h3>
            <p>This visualization provides comprehensive analysis of your content. Enhanced AI-powered visualizations with charts and graphs are available when API keys are configured.</p>
        </div>
        
        <div class="content-card">
            <h2 style="color: #FF4500; margin-bottom: 20px;">📄 Full Content</h2>
            <div class="content-text">${content.replace(/</g, '<').replace(/>/g, '>')}</div>
        </div>
        
        <div class="insights-grid">
            ${numbers.length > 0 ? `
            <div class="insight-card">
                <div class="insight-title">💰 Financial Data</div>
                <ul class="insight-list">
                    ${numbers.slice(0, 5).map(num => `<li>${num}</li>`).join('')}
                    ${numbers.length > 5 ? `<li>...and ${numbers.length - 5} more</li>` : ''}
                </ul>
            </div>
            ` : ''}
            
            ${percentages.length > 0 ? `
            <div class="insight-card">
                <div class="insight-title">📈 Percentages</div>
                <ul class="insight-list">
                    ${percentages.slice(0, 5).map(pct => `<li>${pct}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            ${dates.length > 0 ? `
            <div class="insight-card">
                <div class="insight-title">📅 Important Dates</div>
                <ul class="insight-list">
                    ${dates.slice(0, 5).map(date => `<li>${date}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
            
            <div class="insight-card">
                <div class="insight-title">🔍 Key Insights</div>
                <ul class="insight-list">
                    <li>Content Type: ${contentType.toUpperCase()}</li>
                    <li>Complexity: ${sentences.length > 20 ? 'High' : sentences.length > 10 ? 'Medium' : 'Low'}</li>
                    <li>Reading Time: ~${Math.ceil(words.length / 200)} min</li>
                    <li>Structure: ${lines.length} sections</li>
                </ul>
            </div>
        </div>
        <div class="stats">
            <div class="stat-card">
                <div class="stat-number">${words.length}</div>
                <div class="stat-label">Words</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${lines.length}</div>
                <div class="stat-label">Lines</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${sentences.length}</div>
                <div class="stat-label">Sentences</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${content.length}</div>
                <div class="stat-label">Characters</div>
            </div>
        </div>
    </div>
</body>
</html>`;
};