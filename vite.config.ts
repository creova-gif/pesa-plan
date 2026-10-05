import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { aiGatewayPlugin } from './server/devPlugin.mjs'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    // Dev/preview only. The handler is not imported by the client bundle.
    aiGatewayPlugin(),
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.svg', 'icon-512.svg', 'icon-maskable-512.svg'],
      manifest: {
        name: 'Maokoto – Budget & Finance',
        short_name: 'Maokoto',
        description: 'Track spending, set savings goals, and manage mobile money (M-Pesa, Airtel, Tigo) — built for East Africa. Works offline, 100% private.',
        theme_color: '#FD8240',
        background_color: '#1A3D2E',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait',
        scope: '/',
        start_url: '/?source=pwa',
        id: 'app.maokoto',
        categories: ['finance', 'productivity'],
        lang: 'en',
        dir: 'ltr',
        // Play Store / iOS App Store: icons must include maskable + 192 + 512
        icons: [
          { src: '/icon-192.svg',         sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-512.svg',         sizes: '512x512', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon-maskable-512.svg',sizes: '512x512', type: 'image/svg+xml', purpose: 'maskable' },
        ],
        // Google Play Store TWA: shortcuts surface in launcher long-press
        shortcuts: [
          {
            name: 'Log Expense',
            short_name: 'Expense',
            description: 'Quickly log a new expense',
            url: '/?action=expense&source=shortcut',
            icons: [{ src: '/icon-192.svg', sizes: '192x192' }],
          },
          {
            name: 'Check Balance',
            short_name: 'Balance',
            description: 'View your current balance',
            url: '/?tab=wallet&source=shortcut',
            icons: [{ src: '/icon-192.svg', sizes: '192x192' }],
          },
        ],
        // Shown in Play Store listing
        screenshots: [
          { src: '/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', form_factor: 'narrow', label: 'Home screen' },
        ],
        // Privacy: no data sent to third-party analytics
        related_applications: [],
        prefer_related_applications: false,
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Skip waiting so updates apply immediately
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts', expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            // Supabase API: network first so data stays fresh, fall back to cache
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: { cacheName: 'supabase-api', expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 } },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-motion': ['motion/react'],
          'vendor-recharts': ['recharts'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5000,
    allowedHosts: true,
  },
})
