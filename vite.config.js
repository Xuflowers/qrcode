import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  // ↓↓↓ 新增这一行，解决 GitHub Pages 部署后资源路径问题 ↓↓↓
  base: './',
  // ↑↑↑ 新增这一行 ↑↑↑
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true
  }
})