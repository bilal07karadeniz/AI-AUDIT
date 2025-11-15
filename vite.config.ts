import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/claude': {
        target: 'https://api.anthropic.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/claude/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add headers for Claude API
            if (req.headers['x-api-key']) {
              proxyReq.setHeader('X-API-Key', req.headers['x-api-key']);
            }
            if (req.headers['anthropic-dangerous-direct-browser-access']) {
              proxyReq.setHeader('anthropic-dangerous-direct-browser-access', req.headers['anthropic-dangerous-direct-browser-access']);
            }
            proxyReq.setHeader('anthropic-version', '2023-06-01');
          });
        }
      }
    }
  },
  optimizeDeps: {
    // Rollup native binary sorununu çözmek için
    exclude: ['@rollup/rollup-win32-x64-msvc']
  },
  build: {
    rollupOptions: {
      // Native binary kullanmayı zorla devre dışı bırak
      external: []
    }
  },
  // Eğer yukarıdakiler çalışmazsa bu seçeneği deneyin
  define: {
    'process.env.ROLLUP_NATIVE': 'false'
  }
})