import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import compression from 'vite-plugin-compression'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    compression({ algorithm: 'brotliCompress' }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['browser-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'logo-golden.png', 'logo-dark.png'],
      manifest: {
        name: 'GuestO Restaurant',
        short_name: 'GuestO',
        description: 'Taste of Tradition',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/browser-icon.png',
            sizes: 'any',
            type: 'image/png',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
    },
  },
  optimizeDeps: {
    include: ['jspdf', 'jspdf-autotable', 'exceljs', 'file-saver'],
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('socket.io-client')) {
              return 'socket';
            }
            if (id.includes('jspdf') || id.includes('exceljs') || id.includes('file-saver')) {
              return 'reports';
            }
            if (id.includes('leaflet')) {
              return 'maps';
            }
            if (id.includes('sweetalert2')) {
              return 'alerts';
            }
            if (id.includes('gsap')) {
              return 'animations';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('axios') || id.includes('date-fns')) {
              return 'utils';
            }
          }
        }
      }
    }
  }
})


