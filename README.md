# Astra AI Chat Interface

RocketHub's Company Intelligence Agent with AI-powered visualizations.

## 🚀 Features

- **AI Chat Interface**: Interactive conversation with Astra AI
- **Data Visualizations**: AI-generated charts and dashboards
- **PWA Support**: Install as a mobile/desktop app
- **Responsive Design**: Works on all devices
- **RocketHub Branding**: Custom styling and logos

## 🔧 Environment Setup

### For Local Development:
1. Copy `.env.example` to `.env`
2. Add your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

### For Production Deployment:

#### Netlify:
1. Go to your Netlify dashboard
2. Navigate to Site Settings > Environment Variables
3. Add: `VITE_GEMINI_API_KEY` = `your_actual_api_key`
4. Redeploy the site

#### Bolt Hosting:
1. Go to your Bolt Hosting dashboard
2. Navigate to your project settings
3. Find "Environment Variables" section
4. Add: `VITE_GEMINI_API_KEY` = `your_actual_api_key`
5. Redeploy the application

#### Other Platforms:
- **Netlify**: Add environment variables in Site Settings > Environment Variables
- **Vercel**: Add in Project Settings > Environment Variables
- **GitHub Pages**: Use GitHub Secrets for Actions

## 🔑 Getting a Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated key
5. Add it to your environment variables

## 📱 PWA Installation

The app can be installed as a Progressive Web App:
- **Mobile**: Tap "Add to Home Screen" when prompted
- **Desktop**: Click the install icon in the address bar

## 🛠️ Development

```bash
npm install
npm run dev
```

## 🚀 Deployment

```bash
npm run build
```

The `dist` folder contains the built application ready for deployment.

## 🔒 Security Notes

- Never commit API keys to version control
- Always use environment variables for sensitive data
- The `.env` file is ignored by git for security