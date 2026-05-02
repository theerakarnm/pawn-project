import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // ❗ เพิ่ม Host ให้รองรับการเชื่อมต่อจาก LINE Proxy
    host: true,

    // (Optional) ถ้าต้องการให้เข้าถึงผ่าน http://localhost:5173 ได้ด้วย
    allowedHosts: ['localhost', '.ngrok-free.app']
  }
})
