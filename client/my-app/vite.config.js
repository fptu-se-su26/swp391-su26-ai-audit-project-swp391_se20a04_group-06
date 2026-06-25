import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Trong Docker: backend service name (docker-compose service name)
// Ngoài Docker: localhost:5000
const backendTarget =
  process.env.VITE_API_TARGET ||
  (process.env.NODE_ENV === "production"
    ? "http://backend:5000"
    : "http://localhost:5000");

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: "0.0.0.0",
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
