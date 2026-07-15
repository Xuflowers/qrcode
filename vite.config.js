import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')   // 配置 @ 指向 src，方便导入
    }
  },
  server: {
    host: '0.0.0.0',   // 允许局域网访问（手机扫码调试）
    port: 5173,
    open: true
  }
})