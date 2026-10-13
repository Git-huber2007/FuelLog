import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  resolve: {
    alias: { '@fuellog/shared': fileURLToPath(new URL('../shared/src/index.ts', import.meta.url)) },
  },
  server: {
    host: '127.0.0.1', // Vite's default on Windows binds IPv6 only, which browsers resolving localhost to IPv4 cannot reach
    port: 5173,
    proxy: { '/api': 'http://localhost:4000' },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'og-image.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: {
        id: '/',
        name: 'FuelLog',
        short_name: 'FuelLog',
        description: 'Calorie, macro and gym tracker for beginners.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#0b0c0c',
        background_color: '#0b0c0c',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          {
            name: 'Log Food',
            short_name: 'Food',
            description: "Log today's calories and macros",
            url: '/',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Workout',
            short_name: 'Workout',
            description: "View and track today's workout sets",
            url: '/workout',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
          {
            name: 'Progress',
            short_name: 'Progress',
            description: 'Check weight and measurements trends',
            url: '/progress',
            icons: [{ src: 'icon-192.png', sizes: '192x192' }],
          },
        ],
      },
      workbox: {
        // Cache the app shell only. API calls always go to the network.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-photos',
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 24 * 60 * 60, // 60 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^\/api\/.*/i,
            handler: 'NetworkOnly',
          },
        ],
      },

    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@zxing')) return 'vendor-zxing';
            if (id.includes('@supabase')) return 'vendor-supabase';
            if (id.includes('@tanstack')) return 'vendor-query';
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
          }
        },
      },
    },
  },
});

