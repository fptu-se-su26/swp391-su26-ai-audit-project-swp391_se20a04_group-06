import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Kiểm tra xem frontend có đang chạy trong container Docker hay không
const isDocker =
  process.env.IS_DOCKER === "true" || !!process.env.VITE_API_TARGET;

const backendTarget =
  process.env.VITE_API_TARGET ||
  (isDocker
    ? "http://seafood_backend:5000"
    : "http://localhost:5000");

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: "0.0.0.0",

    // THÊM ĐOẠN NÀY
    allowedHosts: true,

    proxy: {
      "/api": {
        target: backendTarget,
        changeOrigin: true,
      },
      "/socket.io": {
        target: backendTarget,
        changeOrigin: true,
        ws: true,
      },
    },
  },
});