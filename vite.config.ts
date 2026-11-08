/// <reference types="vitest" />
import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'
import packageJson from './package.json' with { type: 'json' }

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_BACKEND_PROXY_URL || 'http://127.0.0.1:8000'
  const apiBase = env.VITE_API_BASE_URL || '/api'

  return {
    plugins: [vue()],
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: fileURLToPath(new URL('./index.html', import.meta.url)),
          echarts: fileURLToPath(
            new URL('./src/shared/ui/BaseChart/echartsCore.ts', import.meta.url)
          ),
        },
      },
    },
    server: {
      port: 5173,
      proxy: {
        [apiBase]: {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path: string) => path,
        },
      },
    },
    test: {
      globals: true,
      environment: 'happy-dom',
      include: ['src/**/*.{test,spec}.{ts,js}', 'tests/**/*.{test,spec}.{ts,js}'],
    },
  }
})
