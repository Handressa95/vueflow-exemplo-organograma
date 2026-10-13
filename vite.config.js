import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 8080,
    open: true,
    watch: {
      // O Visual Studio mantém os índices de .vs bloqueados (EBUSY no Windows).
      ignored: ['**/.vs/**'],
    },
  },
  test: {
    environment: 'jsdom',
  },
})
