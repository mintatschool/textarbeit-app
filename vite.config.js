import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import mkcert from 'vite-plugin-mkcert'
import webfontDl from 'vite-plugin-webfont-dl'

const isNoHttps = process.env.VITE_NO_HTTPS === 'true';
const port = process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 5173;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    !isNoHttps && mkcert(),
    webfontDl(),
    VitePWA({
      disable: isNoHttps,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'logo.png', 'available_syllables.json', 'audio/**/*.mp3'],
      manifest: {
        name: 'Textarbeit',
        short_name: 'Textarbeit',
        description: 'Textarbeit App für die Schule',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'landscape',
        // iOS-compatible scope and start_url
        scope: '/',
        start_url: './',
        // iOS-specific settings
        id: 'textarbeit-app',
        icons: [
          {
            src: 'apple-touch-icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'apple-touch-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      devOptions: {
        enabled: false, // Disabled in dev to prevent caching confusion
        type: 'module',
        navigateFallback: 'index.html'
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,mp3,wav,woff2,ttf}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        // Maximum file size to precache (default is 2MB, increase for audio files)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Cache all local assets with NetworkFirst strategy for offline support
            urlPattern: ({ request, sameOrigin }) => sameOrigin && request.destination !== 'document',
            handler: 'CacheFirst',
            options: {
              cacheName: 'local-assets-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.includes('/audio/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'audio-cache',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      }
    })
  ].filter(Boolean),
  base: './', // Makes the build portable (works in subfolders and locally)
  server: {
    host: true, // Listen on all local IP addresses
    https: !isNoHttps,
    port: port,
    allowedHosts: true, // Allow tunnel hosts like .trycloudflare.com
    hmr: {
      clientPort: 443, // Standard port for the tunnel's HTTPS interface
    },
  },
  preview: {
    host: true, // Listen on all local IP addresses for preview as well
    https: !isNoHttps,
    port: port,
    allowedHosts: true,
  },
})
