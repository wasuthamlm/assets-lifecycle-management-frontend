import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // ทดสอบหน้า LIFF บนมือถือผ่าน tunnel (LIFF บังคับ https): ยอมรับ host ของ tunnel
    // + ส่ง /api ต่อไป backend ทำให้ใช้ tunnel ตัวเดียว (ตั้ง VITE_API_BASE_URL=/api/v1 ใน .env.development.local)
    allowedHosts: ['.trycloudflare.com', '.ngrok-free.app'],
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
