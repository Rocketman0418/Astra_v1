import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { loadEnv } from 'vite';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // Log environment variables for debugging
  console.log('🔧 Vite Config Debug:', {
    mode,
    hasGeminiKey: !!env.VITE_GEMINI_API_KEY,
    geminiKeyLength: env.VITE_GEMINI_API_KEY?.length || 0,
    geminiKeyStart: env.VITE_GEMINI_API_KEY?.substring(0, 10) || 'N/A',
    allEnvKeys: Object.keys(env).filter(key => key.startsWith('VITE_'))
  });
  
  return {
  base: '/',
  define: {
    // Explicitly define environment variables for production builds
    'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
    'process.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY || ''),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['RocketHub Favicon.png', 'RocketHub Logo Alt 1.png'],
      manifest: {
        name: 'Astra AI - Company Intelligence Agent',
        short_name: 'Astra AI',
        description: 'Your RocketHub AI Executive Agent for company intelligence and data visualization',
        theme_color: '#FF4500',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'RocketHub Favicon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'RocketHub Favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        categories: ['business', 'productivity', 'utilities'],
        shortcuts: [
          {
            name: 'New Chat',
            short_name: 'Chat',
            description: 'Start a new conversation with Astra',
            url: '/',
            icons: [{ src: 'RocketHub Favicon.png', sizes: '96x96' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gemini-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          },
          {
            urlPattern: /^https:\/\/healthrocket\.app\.n8n\.cloud\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'webhook-api-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 5 // 5 minutes
              }
            }
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  };
});
